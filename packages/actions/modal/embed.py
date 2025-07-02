import modal
import torch
import torch.nn.functional as F
from typing import List, Dict, Any
from torch import Tensor

# Create the Modal app
app = modal.App("text-embeddings")

# Define the image with all required dependencies
image = modal.Image.debian_slim(python_version="3.11").pip_install(
    [
        "torch>=2.0.0",
        "transformers>=4.35.0",
        "tokenizers>=0.14.0",
        "accelerate>=0.21.0",
        "safetensors>=0.4.0",
    ]
)

# Global variables for model and tokenizer
MODEL_NAME = "intfloat/multilingual-e5-large-instruct"


def average_pool(last_hidden_states: Tensor, attention_mask: Tensor) -> Tensor:
    """Average pooling function for generating embeddings."""
    last_hidden = last_hidden_states.masked_fill(~attention_mask[..., None].bool(), 0.0)
    return last_hidden.sum(dim=1) / attention_mask.sum(dim=1)[..., None]


def get_detailed_instruct(task_description: str, query: str) -> str:
    """Format query with instruction as required by the model."""
    return f"Instruct: {task_description}\nQuery: {query}"


@app.cls(
    image=image,
    gpu="A10G",
    timeout=300,
)
class EmbeddingModel:
    def init(self):
        """Initialize the model and tokenizer on container startup."""
        # Avoid top-level import to prevent linter errors
        import transformers

        print(f"Loading model: {MODEL_NAME}")
        self.tokenizer = transformers.AutoTokenizer.from_pretrained(MODEL_NAME)
        self.model = transformers.AutoModel.from_pretrained(
            MODEL_NAME,
            torch_dtype=torch.float16,  # Use half precision for GPU efficiency
            device_map="auto",
        )
        self.model.eval()
        print("Model loaded successfully!")

    def embed_texts(
        self,
        texts: List[str],
        task_description: str = "Given a text, retrieve semantically similar content",
        add_instruction: bool = True,
        normalize: bool = True,
    ) -> List[List[float]]:
        """
        Generate embeddings for a list of texts.

        Args:
            texts: List of texts to embed
            task_description: Task description for instruction-following
            add_instruction: Whether to add instruction prefix to queries
            normalize: Whether to normalize embeddings

        Returns:
            List of embedding vectors (each vector is a list of floats)
        """
        # Prepare input texts
        if add_instruction:
            input_texts = [
                get_detailed_instruct(task_description, text) for text in texts
            ]
        else:
            input_texts = texts

        # Tokenize input texts
        with torch.no_grad():
            batch_dict = self.tokenizer(
                input_texts,
                max_length=512,
                padding=True,
                truncation=True,
                return_tensors="pt",
            )

            # Move to GPU if available
            if torch.cuda.is_available():
                batch_dict = {k: v.cuda() for k, v in batch_dict.items()}

            # Generate embeddings
            outputs = self.model(**batch_dict)
            embeddings = average_pool(
                outputs.last_hidden_state, batch_dict["attention_mask"]
            )

            # Normalize embeddings if requested
            if normalize:
                embeddings = F.normalize(embeddings, p=2, dim=1)

            # Convert to CPU and return as list
            return embeddings.cpu().float().tolist()

    def embed_single_text(
        self,
        text: str,
        task_description: str = "Given a text, retrieve semantically similar content",
        add_instruction: bool = True,
        normalize: bool = True,
    ) -> List[float]:
        """
        Generate embedding for a single text.

        Args:
            text: Text to embed
            task_description: Task description for instruction-following
            add_instruction: Whether to add instruction prefix to query
            normalize: Whether to normalize embedding

        Returns:
            Embedding vector as a list of floats
        """
        embeddings = self.embed_texts(
            [text], task_description, add_instruction, normalize
        )
        return embeddings[0]


# Create a web endpoint for the embedding service
@app.function(
    image=image,
    timeout=60,
    gpu="A10G",
)
@modal.fastapi_endpoint(method="POST", label="embed-text")
def embed_endpoint(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Web endpoint for text embedding.

    Expected JSON payload:
    {
        "text": "string" or ["list", "of", "strings"],
        "task_description": "optional task description",
        "add_instruction": true/false (optional, default: true),
        "normalize": true/false (optional, default: true)
    }

    Returns:
    {
        "embeddings": [...] or [[...], [...], ...],
        "dimension": int,
        "model": "model_name"
    }
    """
    try:
        # Extract parameters from request
        text_input = data.get("text")
        task_description = data.get(
            "task_description", "Given a text, retrieve semantically similar content"
        )
        add_instruction = data.get("add_instruction", True)
        normalize = data.get("normalize", True)

        if not text_input:
            return {"error": "Missing 'text' field in request"}

        # Get the embedding model class from the app
        model = EmbeddingModel()
        model.init()

        # Handle both single text and list of texts
        if isinstance(text_input, str):
            # Single text
            embedding = model.embed_single_text(
                text_input, task_description, add_instruction, normalize
            )
            return {
                "embeddings": embedding,
                "dimension": len(embedding),
                "model": MODEL_NAME,
                "input_type": "single",
            }
        elif isinstance(text_input, list):
            # Multiple texts
            embeddings = model.embed_texts(
                text_input, task_description, add_instruction, normalize
            )
            return {
                "embeddings": embeddings,
                "dimension": len(embeddings[0]) if embeddings else 0,
                "model": MODEL_NAME,
                "input_type": "batch",
                "count": len(embeddings),
            }
        else:
            return {"error": "Text input must be a string or list of strings"}

    except Exception as e:
        return {"error": f"An error occurred: {str(e)}"}

import "dotenv/config"
import { ChromaClient } from "chromadb"
import { db } from "../db"
import * as cliProgress from "cli-progress"
import pMap from "p-map"

const MODAL_EMBED_URL = "https://aupadhyay--embed-text.modal.run"
const TASK_DESCRIPTION =
  "Given a search query, retrieve relevant personal notes, thoughts, and tasks"

const chroma = new ChromaClient({
  path: "http://localhost:8000",
})

export async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch(MODAL_EMBED_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: text,
      task_description: TASK_DESCRIPTION,
      add_instruction: true,
      normalize: true,
    }),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data = await response.json()

  if (data.error) {
    throw new Error(`API error: ${data.error}`)
  }

  return data.embeddings ?? []
}

async function main() {
  // Get or create collection
  const collection = await chroma.getOrCreateCollection({
    name: "thoughts",
    metadata: {
      description: "Embedded thought chunks for semantic search",
    },
  })

  // Clear existing data from the collection
  console.log("Clearing existing data from ChromaDB...")
  const existingCount = await collection.count()
  if (existingCount > 0) {
    // Get all IDs and delete them
    const existingData = await collection.get()
    if (existingData.ids.length > 0) {
      await collection.delete({
        ids: existingData.ids,
      })
      console.log(`Cleared ${existingCount} existing documents`)
    }
  }

  const thoughts = db.getAllThoughts()
  let totalChunks = 0

  console.log(`Processing ${thoughts.length} thoughts...`)

  // Prepare all chunks with metadata
  interface ChunkData {
    line: string
    chunkId: string
    thoughtId: number
    chunkIndex: number
    totalChunks: number
    originalTimestamp: string
  }

  const allChunks: ChunkData[] = []

  for (const thought of thoughts) {
    // Split by newlines and filter out empty lines
    const lines = thought.content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    // Prepare chunk data
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (!line) continue

      allChunks.push({
        line,
        chunkId: `thought_${thought.id}_chunk_${i}`,
        thoughtId: thought.id,
        chunkIndex: i,
        totalChunks: lines.length,
        originalTimestamp: thought.timestamp.toISOString(),
      })
    }
  }

  console.log(`Total chunks to process: ${allChunks.length}`)

  // Create progress bars
  const multibar = new cliProgress.MultiBar(
    {
      clearOnComplete: false,
      hideCursor: true,
      format: " {bar} | {percentage}% | {value}/{total} | {label}",
    },
    cliProgress.Presets.shades_classic
  )

  const overallProgress = multibar.create(allChunks.length, 0, {
    label: "Overall Progress",
  })

  // Process chunks in parallel with concurrency limit
  const CONCURRENCY = 20 // Adjust based on your rate limits
  await pMap(
    allChunks,
    async (chunk) => {
      try {
        const embedding = await getEmbedding(chunk.line)

        // Add to Chroma with metadata
        await collection.add({
          ids: [chunk.chunkId],
          embeddings: [embedding],
          documents: [chunk.line],
          metadatas: [
            {
              thoughtId: chunk.thoughtId.toString(),
              chunkIndex: chunk.chunkIndex,
              totalChunks: chunk.totalChunks,
              originalTimestamp: chunk.originalTimestamp,
              chunkId: chunk.chunkId,
            },
          ],
        })

        totalChunks++
        overallProgress.increment()
      } catch (error) {
        console.log(`\nError processing chunk ${chunk.chunkId}: ${error}`)
        overallProgress.increment()
      }
    },
    { concurrency: CONCURRENCY }
  )

  multibar.stop()

  console.log(
    `\n🎉 Successfully processed ${totalChunks} chunks from ${thoughts.length} thoughts!`
  )

  // Test the collection
  const count = await collection.count()
  console.log(`Collection now contains ${count} documents`)
}

// main().catch(console.error)

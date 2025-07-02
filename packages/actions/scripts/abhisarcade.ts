import "dotenv/config"
import { ChromaClient, IncludeEnum } from "chromadb"
import { db } from "../db"
import * as cliProgress from "cli-progress"
import pMap from "p-map"
import { getEmbedding } from "./generateEmbeddings"
import OpenAI from "openai"

const chroma = new ChromaClient({
  path: "http://localhost:8000",
})

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const QUERY = "What business or software ideas have I had?"

async function main() {
  const collection = await chroma.getOrCreateCollection({
    name: "thoughts",
    metadata: {
      description: "Embedded thought chunks for semantic search",
    },
  })

  console.log("Collection count:", await collection.count())

  console.log(`Querying: "${QUERY}"`)

  // Step 1: Embed the query
  console.log("Embedding query...")
  const queryEmbedding = await getEmbedding(QUERY)

  console.log(queryEmbedding)

  // Step 2: Query ChromaDB for top 20 chunks
  console.log("Searching ChromaDB...")
  const searchResults = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: 20,
    include: [
      IncludeEnum.Documents,
      IncludeEnum.Metadatas,
      IncludeEnum.Distances,
    ],
  })

  console.log(searchResults)

  if (
    !searchResults.metadatas ||
    !searchResults.metadatas[0] ||
    searchResults.metadatas[0].length === 0
  ) {
    console.log("No results found!")
    return
  }

  console.log(`Found ${searchResults.metadatas[0].length} relevant chunks`)

  // Step 3: Get distinct thought IDs
  const thoughtIds = new Set<number>()
  for (const metadata of searchResults.metadatas[0]) {
    if (metadata && metadata.thoughtId) {
      thoughtIds.add(parseInt(metadata.thoughtId as string))
    }
  }

  console.log(`Found ${thoughtIds.size} distinct thoughts`)
  console.log("Thought IDs:", Array.from(thoughtIds))

  // Step 4: Retrieve and print all those thoughts
  console.log("\n" + "=".repeat(80))
  console.log("RELEVANT THOUGHTS:")
  console.log("=".repeat(80))

  const relevantThoughts: Array<{
    id: number
    content: string
    timestamp: Date
  }> = []

  for (const thoughtId of Array.from(thoughtIds).sort()) {
    const thought = db.getThought(thoughtId)
    if (thought) {
      console.log(
        `\n--- Thought ID: ${
          thought.id
        } (${thought.timestamp.toISOString()}) ---`
      )
      console.log(thought.content)
      console.log("-".repeat(60))

      relevantThoughts.push({
        id: thought.id,
        content: thought.content,
        timestamp: thought.timestamp,
      })
    }
  }

  // Step 5: Generate LLM Summary
  console.log("\n" + "=".repeat(80))
  console.log("AI SUMMARY:")
  console.log("=".repeat(80))

  const summary = await generateSummary(QUERY, relevantThoughts)
  console.log(summary)

  // Show chunk details for debugging
  console.log("\n" + "=".repeat(80))
  console.log("CHUNK DETAILS:")
  console.log("=".repeat(80))

  if (searchResults.documents && searchResults.documents[0]) {
    for (let i = 0; i < searchResults.documents[0].length; i++) {
      const metadata = searchResults.metadatas[0]?.[i]
      const document = searchResults.documents[0][i]
      const distance = searchResults.distances?.[0]?.[i]

      console.log(
        `\nChunk ${i + 1} (Thought ID: ${
          metadata?.thoughtId
        }, Distance: ${distance?.toFixed(4)}):`
      )
      console.log(`"${document}"`)
    }
  }
}

async function generateSummary(
  query: string,
  thoughts: Array<{ id: number; content: string; timestamp: Date }>
): Promise<string> {
  const thoughtsText = thoughts
    .map(
      (thought) =>
        `--- Thought ${thought.id} (${thought.timestamp.toISOString()}) ---\n${
          thought.content
        }`
    )
    .join("\n\n")

  const prompt = `Based on the following question and my personal thoughts, please provide a comprehensive summary that directly answers the question.

Question: "${query}"

My Thoughts:
${thoughtsText}

Please analyze these thoughts and provide a clear, organized summary that answers the question. Focus on extracting the key themes, ideas, and insights that are most relevant to the question.`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    })

    return completion.choices[0]?.message?.content || "No response generated"
  } catch (error) {
    console.error("Error generating summary:", error)
    return "Failed to generate summary"
  }
}

main().catch(console.error)

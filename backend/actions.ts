import { db } from "./db"
import type { Thought as DBThought } from "./db"
import { z } from "zod"
import { defineAction } from "./defineAction"

export const ThoughtSchema = z.object({
  id: z.string(),
  content: z.string(),
  createdAt: z.date(),
})
export type Thought = z.infer<typeof ThoughtSchema>

export const createThought = defineAction(
  z.object({
    content: z.string(),
  }),
  ThoughtSchema,
  async (val) => {
    console.log("createThought", val)
    const content = val.content
    db.saveThought(content)
    return {
      id: String(Date.now()),
      content,
      createdAt: new Date(),
    }
  }
)

export const getThoughts = defineAction(
  z.object({}),
  ThoughtSchema.array(),
  async () => {
    const dbThoughts = db.getAllThoughts()
    return dbThoughts.map((thought: DBThought) => ({
      id: thought.id.toString(),
      content: thought.content,
      createdAt: thought.timestamp,
    }))
  }
)

export const updateThought = defineAction(
  z.object({
    thoughtId: z.string(),
    content: z.string(),
  }),
  ThoughtSchema.nullable(),
  async ({ thoughtId, content }) => {
    // TODO: implement real update logic
    return null
  }
)

export const deleteThought = defineAction(
  z.object({
    thoughtId: z.string(),
  }),
  z.boolean(),
  async ({ thoughtId }) => {
    // TODO: implement real delete logic
    return true
  }
)

export const importDatabase = defineAction(
  z.object({
    filePath: z.string(),
  }),
  z.object({
    importedCount: z.number(),
  }),
  async ({ filePath }) => {
    try {
      console.log("importDatabase", filePath)
      const importedCount = await db.importFromDatabase(filePath)
      return {
        importedCount,
      }
    } catch (error) {
      console.error("Import failed:", error)
      throw new Error(
        `Failed to import database: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      )
    }
  }
)

export const deleteAllThoughts = defineAction(
  z.object({}),
  z.object({
    success: z.boolean(),
  }),
  async () => {
    db.deleteAllThoughts()
    return {
      success: true,
    }
  }
)

export const getDatabasePath = defineAction(
  z.object({}),
  z.object({
    path: z.string().nullable(),
  }),
  async () => {
    return {
      path: db.getDatabasePath(),
    }
  }
)

export const runLLM = defineAction(
  z.object({
    prompt: z.string(),
  }),
  z.string(),
  async ({ prompt }) => {
    return "Hello, world!"
  }
)

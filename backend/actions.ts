import { db } from "./db"
import type { Thought as DBThought } from "./db"
import { z } from "zod"
import { defineAction } from "./defineAction"

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
})
export type User = z.infer<typeof UserSchema>

export const ThoughtSchema = z.object({
  id: z.string(),
  userId: z.string(),
  content: z.string(),
  createdAt: z.date(),
})
export type Thought = z.infer<typeof ThoughtSchema>

// Action: createThought
export const createThought = defineAction(
  z.object({
    userId: z.string(),
    content: z.string(),
  }),
  ThoughtSchema,
  async ({ userId, content }) => {
    db.saveThought(content)
    return {
      id: String(Date.now()),
      userId,
      content,
      createdAt: new Date(),
    }
  }
)

// Action: getThoughts
export const getThoughts = defineAction(
  z.object({
    userId: z.string(),
  }),
  ThoughtSchema.array(),
  async ({ userId }) => {
    const dbThoughts = db.getAllThoughts()
    return dbThoughts.map((thought: DBThought) => ({
      id: thought.id.toString(),
      userId,
      content: thought.content,
      createdAt: thought.timestamp,
    }))
  }
)

// Action: getUser
export const getUser = defineAction(
  z.object({
    userId: z.string(),
  }),
  UserSchema.nullable(),
  async ({ userId }) => {
    return {
      id: userId,
      name: "Example User",
      email: "user@example.com",
    }
  }
)

// Action: updateThought
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

// Action: deleteThought
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

// -----------------------
// Database management helpers (unchanged)
// -----------------------

export async function importDatabase(filePath: string): Promise<number> {
  return await db.importFromDatabase(filePath)
}

export async function deleteAllThoughts(): Promise<void> {
  db.deleteAllThoughts()
}

export function getDatabasePath(): string | null {
  return db.getDatabasePath()
}

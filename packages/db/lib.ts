import dotenv from "dotenv"
import path from "node:path"

dotenv.config({ path: path.resolve(__dirname, "../../.env") })

import { drizzle } from "drizzle-orm/better-sqlite3"
import { thoughts } from "./schema"
import { eq } from "drizzle-orm"

if (!process.env.DB_FILE_PATH) {
  throw new Error("DB_FILE_PATH is not set")
}

export const db = drizzle(process.env.DB_FILE_PATH)

export async function createThought(content: string) {
  return db.insert(thoughts).values({ content }).returning().get()
}

export async function getThoughts() {
  return db.select().from(thoughts).orderBy(thoughts.timestamp).all()
}

export async function getThoughtById(id: number) {
  return db.select().from(thoughts).where(eq(thoughts.id, id)).get()
}

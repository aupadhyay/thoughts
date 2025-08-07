import dotenv from "dotenv"
import path from "node:path"
import os from "node:os"

dotenv.config({ path: path.resolve(__dirname, "../../.env") })

import { drizzle } from "drizzle-orm/better-sqlite3"
import { thoughts } from "./schema"
import { eq } from "drizzle-orm"

export function configPath() {
  if (!process.env.THOUGHTS_CONFIG_PATH) {
    console.warn(
      "THOUGHTS_CONFIG_PATH is not set, using home directory as fallback"
    )
    return path.resolve(os.homedir(), ".thoughts")
  }
  return process.env.THOUGHTS_CONFIG_PATH
}

let db: ReturnType<typeof drizzle> = drizzle(`${configPath()}/local.db`)

function dbSingleton() {
  if (!db) {
    db = drizzle(`${configPath()}/local.db`)
  }
  return db
}

export async function createThought(content: string, metadata?: string | null) {
  return dbSingleton()
    .insert(thoughts)
    .values({ content, metadata: metadata ?? null })
    .returning()
    .get()
}

export async function getThoughts() {
  return dbSingleton().select().from(thoughts).orderBy(thoughts.timestamp).all()
}

export async function getThoughtById(id: number) {
  return dbSingleton().select().from(thoughts).where(eq(thoughts.id, id)).get()
}

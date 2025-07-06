import "dotenv/config"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { thoughts } from "./schema"

if (!process.env.DB_FILE_PATH) {
  throw new Error("DB_FILE_PATH is not set")
}

const db = drizzle(process.env.DB_FILE_PATH)

async function main() {
  const count = await db.$count(thoughts)
  console.log("Number of thoughts: ", count)
}

main()

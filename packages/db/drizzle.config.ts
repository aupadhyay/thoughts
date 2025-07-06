import dotenv from "dotenv"
import path from "node:path"

dotenv.config({ path: path.resolve(__dirname, "../../.env") })

import { defineConfig } from "drizzle-kit"

if (!process.env.DB_FILE_PATH) {
  throw new Error("DB_FILE_PATH is not set")
}

export default defineConfig({
  schema: "./schema.ts",
  out: "./migrations",
  dialect: "sqlite",
  dbCredentials: { url: process.env.DB_FILE_PATH },
})

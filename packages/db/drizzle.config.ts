import dotenv from "dotenv"
import path from "node:path"

dotenv.config({ path: path.resolve(__dirname, "../../.env") })

import { defineConfig } from "drizzle-kit"
import { configPath } from "./lib"

export default defineConfig({
  schema: "./schema.ts",
  out: "./migrations",
  dialect: "sqlite",
  dbCredentials: { url: `${configPath()}/local.db` },
})

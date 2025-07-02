import express from "express"
import { generateApi } from "./generateApi"

async function startServer() {
  const app = express()
  app.use(express.json())

  // Generate OpenAPI spec and register routes in one place
  await generateApi(app)

  const PORT = process.env.PORT || 3000
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
  })
}

startServer().catch(console.error)

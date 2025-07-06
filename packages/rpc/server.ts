import { createHTTPServer } from "@trpc/server/adapters/standalone"
import { buildRouter } from "./index"

const router = buildRouter()
const server = createHTTPServer({
  router,
  middleware: (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Request-Method", "*")
    res.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET")
    res.setHeader("Access-Control-Allow-Headers", "*")
    if (req.method === "OPTIONS") {
      res.writeHead(200)
      res.end()
      return
    }
    next()
  },
})

console.log("Starting server...")
server.listen(4318, () => {
  console.log("Server started on port 4318")
})

const shutdown = () => {
  console.log("\nShutting down server...")
  server.close(() => {
    console.log("Server shutdown complete")
    process.exit(0)
  })
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)

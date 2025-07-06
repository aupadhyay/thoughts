import { createThought, getThoughts } from "@thoughts/db"
import { publicProcedure, router } from "./trpc"
import { z } from "zod"
import { createHTTPServer } from "@trpc/server/adapters/standalone"

const appRouter = router({
  createThought: publicProcedure
    .input(z.string())
    .mutation(async ({ input }) => {
      return await createThought(input)
    }),
  getThoughts: publicProcedure.query(async () => {
    return await getThoughts()
  }),
})

const server = createHTTPServer({
  router: appRouter,
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

server.listen(3000)
console.log("RPC server running on port 3000")

export type AppRouter = typeof appRouter

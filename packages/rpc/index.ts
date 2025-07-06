import { createThought, getThoughts } from "@thoughts/db"
import { publicProcedure, router } from "./trpc"
import { z } from "zod"

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

export const buildRouter = () => appRouter

export type AppRouter = typeof appRouter

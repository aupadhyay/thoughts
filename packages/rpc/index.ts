import { createThought, getThoughts } from "@thoughts/db"
import { publicProcedure, router } from "./trpc"
import { z } from "zod"

const appRouter = router({
  createThought: publicProcedure
    .input(
      z.object({
        content: z.string(),
        metadata: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await createThought(input.content, input.metadata ?? null)
    }),
  getThoughts: publicProcedure
    .input(z.object({ search: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return await getThoughts(input?.search)
    }),
})

export const buildRouter = () => appRouter

export type AppRouter = typeof appRouter

import { z } from "zod"

type AnyZod = z.ZodTypeAny

export type Action<P extends AnyZod, R extends AnyZod> = ((
  args: z.infer<P>
) => Promise<z.infer<R>>) & {
  schema: z.ZodFunction<z.ZodTuple<[P]>, z.ZodPromise<R>>
  paramSchema: P
  resultSchema: R
}

export function defineAction<P extends AnyZod, R extends AnyZod>(
  params: P,
  result: R,
  impl: (args: z.infer<P>) => Promise<z.infer<R>>
): Action<P, R> {
  const schema = z.function(z.tuple([params]), z.promise(result))
  const fn = schema.implement(impl) as unknown as Action<P, R>

  // Attach metadata (enumerable so Object.entries picks them up easily)
  Object.defineProperty(fn, "schema", { value: schema, enumerable: true })
  Object.defineProperty(fn, "paramSchema", { value: params, enumerable: true })
  Object.defineProperty(fn, "resultSchema", { value: result, enumerable: true })

  return fn
}

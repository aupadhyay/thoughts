import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi"
import { z, ZodObject, ZodTypeAny, ZodPromise } from "zod"
import * as actions from "./actions"
import * as fs from "node:fs"
import type { Application } from "express"

extendZodWithOpenApi(z)

interface ActionLike {
  paramSchema: z.ZodTypeAny
  resultSchema: z.ZodTypeAny
  schema: z.ZodFunction<z.ZodTuple<[z.ZodTypeAny]>, z.ZodPromise<z.ZodTypeAny>>
}

function isActionLike(obj: unknown): obj is ActionLike {
  return (
    !!obj &&
    typeof obj === "function" &&
    "paramSchema" in obj &&
    "resultSchema" in obj &&
    "schema" in obj
  )
}

export async function generateApi(app?: Application) {
  const registry = new OpenAPIRegistry()

  // Collect all exported ZodFunction actions
  const actionFunctions = Object.entries(actions)
    .filter(([_key, val]) => isActionLike(val))
    .map(([key, val]) => [key, val as ActionLike])

  if (actionFunctions.length === 0) {
    console.warn("[generateApiSpec] No zod-powered actions found.")
  }

  for (const [name, action] of actionFunctions as [string, ActionLike][]) {
    const paramSchema = action.paramSchema as z.ZodTypeAny | undefined
    let responseSchema = action.resultSchema as z.ZodTypeAny

    // unwrap promise if needed
    if (responseSchema instanceof ZodPromise) {
      responseSchema = responseSchema._def.type
    }

    let paramKeys: string[] = []
    if (paramSchema && paramSchema instanceof ZodObject) {
      paramKeys = Object.keys(paramSchema.shape)
    }

    // All routes are registered as POST /<actionName>
    const method = "post"
    const path = `/${name}`

    const requestConfig: any = {}
    if (paramSchema && paramKeys.length > 0) {
      requestConfig.body = {
        content: {
          "application/json": {
            schema: paramSchema,
          },
        },
      }
    }

    // Register Express route if an app instance was provided
    if (app) {
      console.log(`[generateApiSpec] Registering route -> POST ${path}`)
      app.post(path, async (req: any, res: any) => {
        try {
          const args = req.body
          const result = await (action as any)(args)
          res.json(result)
        } catch (error) {
          res.status(500).json({ error: (error as Error).message })
        }
      })
    }

    registry.registerPath({
      method: method as any,
      path,
      description: `${name} operation`,
      request: requestConfig,
      responses: {
        200: {
          description: "Successful operation",
          content: {
            "application/json": {
              schema: responseSchema,
            },
          },
        },
      },
    })
  }

  const generator = new OpenApiGeneratorV3(registry.definitions)

  const openApiDocument = generator.generateDocument({
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "Thoughts API",
      description: "Automatically generated API from actions.ts",
    },
    servers: [{ url: "http://localhost:3000" }],
  })

  fs.writeFileSync("openapi.json", JSON.stringify(openApiDocument, null, 2))
  console.log("OpenAPI specification saved to openapi.json")

  return {
    openApiDocument,
    registry,
    actionFunctions,
  }
}

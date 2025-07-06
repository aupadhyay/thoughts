import dotenv from "dotenv"
import path from "node:path"

dotenv.config({ path: path.resolve(__dirname, "../../.env") })

import { thoughts } from "./schema"
import { createThought, getThoughts, getThoughtById } from "./lib"

export { thoughts, createThought, getThoughts, getThoughtById }

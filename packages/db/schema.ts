import { sql } from "drizzle-orm"
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core"

export const thoughts = sqliteTable("thoughts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  content: text("content").notNull(),
  timestamp: text("timestamp")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
})

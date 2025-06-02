import Database from "better-sqlite3"
import path from "path"
import { mkdir } from "fs/promises"
import { existsSync } from "fs"

export interface Thought {
  id: number
  content: string
  timestamp: Date
}

class DatabaseManager {
  private static instance: DatabaseManager
  private db: Database.Database | null = null

  private constructor() {
    this.initializeDatabase()
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager()
    }
    return DatabaseManager.instance
  }

  private async initializeDatabase() {
    try {
      // Get application support directory
      const appDir = path.join(
        process.env.HOME || process.env.USERPROFILE || ".",
        ".thoughts"
      )

      // Create directory if it doesn't exist
      if (!existsSync(appDir)) {
        await mkdir(appDir, { recursive: true })
      }

      const dbPath = path.join(appDir, "thoughts.sqlite3")

      // Initialize database connection
      this.db = new Database(dbPath)

      // Create table if it doesn't exist
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS thoughts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          content TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `)
    } catch (error) {
      console.error("Database initialization error:", error)
    }
  }

  public getDatabasePath(): string | null {
    if (!this.db) return null
    return this.db.name
  }

  public saveThought(content: string): void {
    if (!this.db) throw new Error("Database not initialized")

    const stmt = this.db.prepare(
      "INSERT INTO thoughts (content, timestamp) VALUES (?, ?)"
    )
    stmt.run(content, new Date().toISOString())
  }

  public getAllThoughts(): Thought[] {
    if (!this.db) throw new Error("Database not initialized")

    const stmt = this.db.prepare(
      "SELECT * FROM thoughts ORDER BY timestamp DESC"
    )
    const rows = stmt.all() as any[]

    return rows.map((row) => ({
      id: row.id,
      content: row.content,
      timestamp: new Date(row.timestamp),
    }))
  }

  public async importFromDatabase(filePath: string): Promise<number> {
    if (!this.db) throw new Error("Database not initialized")

    let importedCount = 0
    const sourceDb = new Database(filePath)

    try {
      // Get all tables from source database
      const tables = sourceDb
        .prepare("SELECT name FROM sqlite_master WHERE type='table'")
        .all() as any[]

      for (const table of tables) {
        const tableName = table.name
        const columns = sourceDb
          .prepare(`PRAGMA table_info('${tableName}')`)
          .all() as any[]

        // Look for content and timestamp columns
        const contentColumn = columns.find((col) =>
          ["content", "text", "body", "note"].includes(col.name.toLowerCase())
        )
        const timestampColumn = columns.find(
          (col) =>
            ["timestamp", "date", "created_at", "updated_at"].includes(
              col.name.toLowerCase()
            ) &&
            ["timestamp", "datetime", "date", "integer", "text"].includes(
              col.type.toLowerCase()
            )
        )

        if (contentColumn) {
          const query = timestampColumn
            ? `SELECT ${contentColumn.name}, ${timestampColumn.name} FROM ${tableName}`
            : `SELECT ${contentColumn.name} FROM ${tableName}`

          const rows = sourceDb.prepare(query).all() as any[]

          // Begin transaction for better performance
          const insertStmt = this.db.prepare(
            "INSERT INTO thoughts (content, timestamp) VALUES (?, ?)"
          )
          const transaction = this.db.transaction((thoughts: any[]) => {
            for (const thought of thoughts) {
              insertStmt.run(
                thought[contentColumn.name],
                timestampColumn
                  ? new Date(thought[timestampColumn.name]).toISOString()
                  : new Date().toISOString()
              )
            }
          })

          transaction(rows)
          importedCount += rows.length
        }
      }
    } finally {
      sourceDb.close()
    }

    return importedCount
  }

  public deleteAllThoughts(): void {
    if (!this.db) throw new Error("Database not initialized")

    const stmt = this.db.prepare("DELETE FROM thoughts")
    stmt.run()
  }

  public close(): void {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }
}

export const db = DatabaseManager.getInstance()

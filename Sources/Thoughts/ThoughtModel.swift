import Foundation
import SQLite

typealias Expression = SQLite.Expression

struct Thought: Identifiable {
    let id: Int64
    let content: String
    let timestamp: Date
}

class DatabaseManager {
    static let shared = DatabaseManager()
    private var db: Connection?
    
    // Table definition
    private let thoughts = Table("thoughts")
    private let id = Expression<Int64>("id")
    private let content = Expression<String>("content")
    private let timestamp = Expression<Date?>("timestamp")
    
    private init() {
        do {
            let path = NSSearchPathForDirectoriesInDomains(
                .applicationSupportDirectory, .userDomainMask, true
            ).first!
            
            let appDir = (path as NSString).appendingPathComponent("Thoughts")
            try FileManager.default.createDirectory(
                atPath: appDir,
                withIntermediateDirectories: true,
                attributes: nil
            )
            
            let dbPath = (appDir as NSString).appendingPathComponent("thoughts.sqlite3")
            db = try Connection(dbPath)
            
            try db?.run(thoughts.create(ifNotExists: true) { table in
                table.column(id, primaryKey: .autoincrement)
                table.column(content)
                table.column(timestamp)
            })
        } catch {
            print("Database initialization error: \(error)")
        }
    }
    
    func saveThought(_ text: String) {
        do {
            let insert = thoughts.insert([
                content <- text,
                timestamp <- Date()
            ])
            try db?.run(insert)
        } catch {
            print("Failed to save thought: \(error)")
        }
    }
    
    func getAllThoughts() -> [Thought] {
        var result: [Thought] = []
        
        do {
            if let db = db {
                for row in try db.prepare(thoughts.order(timestamp.desc)) {
                    if let ts = row[timestamp] {
                        result.append(Thought(
                            id: row[id],
                            content: row[content],
                            timestamp: ts
                        ))
                    }
                }
            }
        } catch {
            print("Failed to fetch thoughts: \(error)")
        }
        
        return result
    }
} 
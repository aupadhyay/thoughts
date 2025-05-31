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
    
    func importFromDatabase(at fileURL: URL) async throws -> Int {
        let sourceDB = try Connection(fileURL.path)
        var importedCount = 0
        
        // Try to find a table with content and optionally timestamp columns
        let tables = try sourceDB.prepare("SELECT name FROM sqlite_master WHERE type='table'")
        
        for table in tables {
            let tableName = table[0] as! String
            let columns = try sourceDB.prepare("PRAGMA table_info('\(tableName)')")
            
            var hasContent = false
            var hasTimestamp = false
            var contentColumnName = ""
            var timestampColumnName = ""
            
            for column in columns {
                let name = column[1] as! String
                let type = column[2] as! String
                
                // Look for content-like columns
                if ["content", "text", "body", "note"].contains(name.lowercased()) {
                    hasContent = true
                    contentColumnName = name
                }
                
                // Look for timestamp-like columns
                if ["timestamp", "date", "created_at", "updated_at"].contains(name.lowercased()) &&
                   ["timestamp", "datetime", "date", "integer"].contains(type.lowercased()) {
                    hasTimestamp = true
                    timestampColumnName = name
                }
            }
            
            if hasContent {
                let query: String
                if hasTimestamp {
                    query = "SELECT \(contentColumnName), \(timestampColumnName) FROM \(tableName)"
                } else {
                    query = "SELECT \(contentColumnName) FROM \(tableName)"
                }
                
                for row in try sourceDB.prepare(query) {
                    let content = row[0] as! String
                    let timestamp: Date
                    
                    if hasTimestamp {
                        let rawValue = row[1]
                        if let timeInterval = rawValue as? Double {
                            timestamp = Date(timeIntervalSince1970: timeInterval)
                        } else if let timeInterval = rawValue as? Int64 {
                            timestamp = Date(timeIntervalSince1970: TimeInterval(timeInterval))
                        } else if let timeString = rawValue as? String {
                            // Try to parse common date formats
                            let formatter = DateFormatter()
                            formatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
                            if let date = formatter.date(from: timeString) {
                                timestamp = date
                            } else {
                                timestamp = Date()
                            }
                        } else {
                            timestamp = Date()
                        }
                    } else {
                        timestamp = Date()
                    }
                    
                    let insert = thoughts.insert([
                        self.content <- content,
                        self.timestamp <- timestamp
                    ])
                    try db?.run(insert)
                    importedCount += 1
                }
            }
        }
        
        return importedCount
    }
} 
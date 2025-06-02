import Foundation
import OpenAPIClient

struct Thought: Identifiable {
    let id: String
    let content: String
    let timestamp: Date
    
    init(from apiThought: CreateThoughtPost200Response) {
        self.id = apiThought.id
        self.content = apiThought.content
        // Parse the ISO 8601 date string
        let formatter = ISO8601DateFormatter()
        self.timestamp = formatter.date(from: apiThought.createdAt) ?? Date()
    }
}

class DatabaseManager {
    static let shared = DatabaseManager()
    
    private init() {}
    
    func getDatabasePath() async -> String? {
        return await withCheckedContinuation { continuation in
            DefaultAPI.getDatabasePathPost() { data, error in
                if let error = error {
                    print("Failed to get database path: \(error)")
                    continuation.resume(returning: nil)
                } else if let data = data {
                    continuation.resume(returning: data.path)
                } else {
                    continuation.resume(returning: nil)
                }
            }
        }
    }
    
    func saveThought(_ text: String) {
        Task {
            let request = CreateThoughtPostRequest(content: text)
            
            DefaultAPI.createThoughtPost(createThoughtPostRequest: request) { data, error in
                if let error = error {
                    print("Failed to save thought: \(error)")
                } else if let data = data {
                    print("Successfully saved thought with ID: \(data.id)")
                } else {
                    print("No response data received")
                }
            }
        }
    }
    
    func getAllThoughts() async -> [Thought] {
        return await withCheckedContinuation { continuation in
            DefaultAPI.getThoughtsPost { data, error in
                if let error = error {
                    print("Failed to fetch thoughts: \(error)")
                    continuation.resume(returning: [])
                } else if let data = data {
                    let thoughts = data.map { Thought(from: $0) }
                    continuation.resume(returning: thoughts)
                } else {
                    continuation.resume(returning: [])
                }
            }
        }
    }
    
    func importFromDatabase(at fileURL: URL) async throws -> Int {
        return try await withCheckedThrowingContinuation { continuation in
            let request = ImportDatabasePostRequest(filePath: fileURL.path)
            
            DefaultAPI.importDatabasePost(importDatabasePostRequest: request) { data, error in
                if let error = error {
                    continuation.resume(throwing: error)
                } else if let data = data {
                    continuation.resume(returning: Int(data.importedCount))
                } else {
                    continuation.resume(throwing: NSError(domain: "DatabaseImport", code: 0, userInfo: [NSLocalizedDescriptionKey: "No response data received"]))
                }
            }
        }
    }
    
    func deleteAllThoughts() {
        Task {
            DefaultAPI.deleteAllThoughtsPost { data, error in
                if let error = error {
                    print("Failed to delete all thoughts: \(error)")
                } else if let data = data {
                    if data.success {
                        print("Successfully deleted all thoughts")
                    } else {
                        print("Failed to delete all thoughts")
                    }
                } else {
                    print("No response data received")
                }
            }
        }
    }
}
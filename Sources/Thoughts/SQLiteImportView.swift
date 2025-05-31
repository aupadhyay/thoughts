import SwiftUI
import SQLite
import UniformTypeIdentifiers

extension UTType {
    static var sqlite: UTType {
        UTType(filenameExtension: "sqlite3") ?? UTType(filenameExtension: "sqlite") ?? UTType.data
    }
}

struct SQLiteImportView: SwiftUI.View {
    @State private var selectedFile: URL?
    @State private var importStatus: String = ""
    @State private var isImporting = false
    @Environment(\.dismiss) private var dismiss
    
    var body: some SwiftUI.View {
        VStack(spacing: 20) {
            Text("Import SQLite Database")
                .font(.title2)
                .padding(.top)
            
            if let selectedFile = selectedFile {
                Text("Selected file: \(selectedFile.lastPathComponent)")
                    .foregroundColor(.secondary)
            } else {
                Text("No file selected")
                    .foregroundColor(.secondary)
            }
            
            Button("Choose SQLite File") {
                let panel = NSOpenPanel()
                panel.allowsMultipleSelection = false
                panel.canChooseDirectories = false
                panel.allowedContentTypes = [.sqlite]
                
                if panel.runModal() == .OK {
                    selectedFile = panel.url
                }
            }
            .disabled(isImporting)
            
            if !importStatus.isEmpty {
                Text(importStatus)
                    .foregroundColor(importStatus.contains("Error") ? .red : .green)
                    .multilineTextAlignment(.center)
                    .padding()
            }
            
            HStack(spacing: 20) {
                Button("Import") {
                    guard let fileURL = selectedFile else { return }
                    isImporting = true
                    importStatus = "Importing..."
                    
                    Task {
                        do {
                            let count = try await DatabaseManager.shared.importFromDatabase(at: fileURL)
                            importStatus = "Successfully imported \(count) thoughts!"
                            isImporting = false
                        } catch {
                            importStatus = "Error: \(error.localizedDescription)"
                            isImporting = false
                        }
                    }
                }
                .disabled(selectedFile == nil || isImporting)
                
                Button("Close") {
                    dismiss()
                }
                .disabled(isImporting)
            }
        }
        .frame(width: 400, height: 300)
        .padding()
    }
} 
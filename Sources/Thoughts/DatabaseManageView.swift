import SwiftUI
import UniformTypeIdentifiers

struct DatabaseManageView: View {
    @State private var selectedFile: URL?
    @State private var importStatus: String = ""
    @State private var isImporting = false
    @State private var showingDeleteConfirmation = false
    @State private var copySuccess = false
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 20) {
            Text("Manage Database")
                .font(.title2)
                .padding(.top)

            // Current Database Section
            GroupBox(label: Text("Current Database")) {
                VStack(spacing: 15) {
                    if let dbPath = DatabaseManager.shared.getDatabasePath() {
                        Text(dbPath)
                            .font(.system(.caption, design: .monospaced))
                            .foregroundColor(.secondary)
                            .lineLimit(1)
                            .truncationMode(.middle)

                        Button {
                            NSPasteboard.general.clearContents()
                            NSPasteboard.general.setString(dbPath, forType: .string)
                            copySuccess = true

                            // Reset success message after delay
                            DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                                copySuccess = false
                            }
                        } label: {
                            HStack {
                                Image(systemName: copySuccess ? "checkmark.circle.fill" : "doc.on.doc")
                                Text(copySuccess ? "Copied!" : "Copy Path")
                            }
                        }
                    }
                }
                .padding()
            }
            .padding(.horizontal)

            // Import Section
            GroupBox(label: Text("Import Database")) {
                VStack(spacing: 15) {
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
                        panel.allowedContentTypes = [UTType(tag: "sqlite3", tagClass: .filenameExtension, conformingTo: nil),
                                                   UTType(tag: "sqlite", tagClass: .filenameExtension, conformingTo: nil),
                                                   UTType(tag: "db", tagClass: .filenameExtension, conformingTo: nil)].compactMap { $0 }

                        if panel.runModal() == .OK {
                            selectedFile = panel.url
                        }
                    }
                    .disabled(isImporting)

                    Button("Import Selected File") {
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
                }
                .padding()
            }
            .padding(.horizontal)

            // Delete Section
            GroupBox(label: Text("Danger Zone")) {
                VStack(spacing: 15) {
                    Button(role: .destructive) {
                        showingDeleteConfirmation = true
                    } label: {
                        HStack {
                            Image(systemName: "trash")
                            Text("Delete All Thoughts")
                        }
                    }
                    .buttonStyle(.borderedProminent)
                }
                .padding()
            }
            .padding(.horizontal)

            if !importStatus.isEmpty {
                Text(importStatus)
                    .foregroundColor(importStatus.contains("Error") ? .red : .green)
                    .multilineTextAlignment(.center)
                    .padding()
            }

            Button("Close") {
                dismiss()
            }
            .padding()
        }
        .frame(width: 400, height: 500)
        .alert("Delete All Thoughts", isPresented: $showingDeleteConfirmation) {
            Button("Cancel", role: .cancel) { }
            Button("Delete", role: .destructive) {
                DatabaseManager.shared.deleteAllThoughts()
                importStatus = "All thoughts have been deleted."
            }
        } message: {
            Text("Are you sure you want to delete all thoughts? This action cannot be undone.")
        }
    }
}
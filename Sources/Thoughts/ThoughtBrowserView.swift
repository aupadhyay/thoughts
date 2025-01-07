import SwiftUI

struct ThoughtBrowserView: View {
    @State private var thoughts: [Thought] = []
    @State private var searchText: String = ""
    
    var filteredThoughts: [Thought] {
        if searchText.isEmpty {
            return thoughts
        }
        return thoughts.filter { $0.content.localizedCaseInsensitiveContains(searchText) }
    }
    
    var body: some View {
        VStack {
            TextField("Search thoughts...", text: $searchText)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .padding()
            
            List(filteredThoughts) { thought in
                VStack(alignment: .leading, spacing: 4) {
                    Text(thought.content)
                        .font(.system(size: 14))
                    Text(thought.timestamp.formatted())
                        .font(.caption)
                        .foregroundColor(.gray)
                }
                .padding(.vertical, 4)
            }
        }
        .frame(minWidth: 500, minHeight: 400)
        .onAppear {
            thoughts = DatabaseManager.shared.getAllThoughts()
        }
    }
} 
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
                VStack(alignment: .leading) {
                    Text(thought.content)
                        .lineLimit(2)
                    Text(thought.timestamp.formatted())
                        .font(.caption)
                        .foregroundColor(.gray)
                }
            }
        }
        .frame(minWidth: 500, minHeight: 400)
        .onAppear {
            thoughts = DatabaseManager.shared.getAllThoughts()
        }
    }
} 
import SwiftUI
import AppKit

struct ContentView: View {
    @State private var thoughtText: String = ""
    @FocusState private var isFocused: Bool
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        ZStack {
            Color.clear
            
            TextEditor(text: $thoughtText)
                .font(.system(size: 14))
                .padding(5)
                .focused($isFocused)
                .background(.clear)
                .colorScheme(.dark)
        }
        .frame(width: 400, height: 300)
        .background(Material.ultraThinMaterial)
        .opacity(0.95)
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .onAppear {
            setupKeyMonitor()
            DispatchQueue.main.async {
                isFocused = true
            }
        }
    }
    
    private func setupKeyMonitor() {
        NSEvent.addLocalMonitorForEvents(matching: .keyDown) { event in
            if event.keyCode == 36 { // Return key
                if event.modifierFlags.contains(.shift) {
                    thoughtText += "\n"
                    return event
                }
                saveAndClose()
                return nil
            }
            if event.keyCode == 53 { // Escape key
                NSApplication.shared.keyWindow?.close()
                return nil
            }
            return event
        }
    }
    
    private func saveAndClose() {
        if !thoughtText.isEmpty {
            DatabaseManager.shared.saveThought(thoughtText)
        }
        NSApplication.shared.keyWindow?.close()
    }
} 

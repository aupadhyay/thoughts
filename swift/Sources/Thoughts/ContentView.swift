import SwiftUI
import AppKit

struct ContentView: View {
    @State private var thoughtText: String = ""
    @FocusState private var isFocused: Bool
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        ZStack {
            Color.clear
            
            if #available(macOS 13.0, *) {
                TextEditor(text: $thoughtText)
                    .font(.system(size: 18))
                    .scrollContentBackground(.hidden)
                    .background(.clear)
                    .foregroundColor(.white)
                    .overlay(
                        Group {
                            if thoughtText.isEmpty {
                                Text("wazzzzzup")
                                    .foregroundColor(.white.opacity(0.5))
                                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                                    .padding(.leading, 5)
                                    .allowsHitTesting(false)
                                    .font(.system(size: 18))
                            }
                        }
                    )
                    .padding(.top, 8)
                    .padding(.leading, 8)
                    .focused($isFocused)
                    .tint(.white.opacity(0.7))
            } else {
                // Fallback on earlier versions
            }
        }
        .frame(
            width: CGFloat(QUICK_PANEL_WIDTH),
            height: CGFloat(QUICK_PANEL_HEIGHT) + (CGFloat(thoughtText.filter { $0 == "\n" }.count)/2 * CGFloat(QUICK_PANEL_LINE_HEIGHT))
        )
        .background(Material.ultraThinMaterial)
        .opacity(0.98)
        .clipShape(RoundedRectangle(cornerRadius: 12))
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
            thoughtText = ""
        }
        NSApplication.shared.keyWindow?.close()
    }
} 

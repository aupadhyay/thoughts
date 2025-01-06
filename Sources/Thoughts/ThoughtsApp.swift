import SwiftUI
import AppKit
import KeyboardShortcuts

extension KeyboardShortcuts.Name {
    static let toggleThoughts = Self("toggleThoughts")
}

@main
struct ThoughtsApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    
    var body: some Scene {
        Settings {
            KeyboardShortcuts.Recorder(for: .toggleThoughts)
        }
    }
}

class AppDelegate: NSObject, NSApplicationDelegate {
    var statusItem: NSStatusItem?
    var quickWindow: NSWindow?
    var browserWindow: NSWindow?
    
    func applicationDidFinishLaunching(_ notification: Notification) {
        setupStatusBarItem()
        setupQuickWindow()
        setupShortcuts()
        
        // Show browser if launched with --browser flag or from Finder
        if CommandLine.arguments.contains("--browser") || NSApp.activationPolicy() == .regular {
            setupAndShowBrowserWindow()
        }
    }
    
    private func setupStatusBarItem() {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        if let button = statusItem?.button {
            button.image = NSImage(systemSymbolName: "cloud.fill", accessibilityDescription: "Thoughts")
            button.action = #selector(showBrowser(_:))
            button.target = self
        }
    }
    
    private func setupShortcuts() {
        if KeyboardShortcuts.getShortcut(for: .toggleThoughts) == nil {
            KeyboardShortcuts.setShortcut(.init(.space, modifiers: [.option]), for: .toggleThoughts)
        }
        
        KeyboardShortcuts.onKeyDown(for: .toggleThoughts) { [weak self] in
            self?.toggleQuickWindow(nil)
        }
    }
    
    private func setupQuickWindow() {
        let window = NSPanel(
            contentRect: NSRect(x: 0, y: 0, width: 400, height: 100),
            styleMask: [.borderless, .nonactivatingPanel, .titled],
            backing: .buffered,
            defer: false
        )
        window.isMovableByWindowBackground = true
        window.backgroundColor = .clear
        window.hasShadow = true
        window.level = .floating
        window.isOpaque = false
        window.titleVisibility = .hidden
        window.titlebarAppearsTransparent = true
        window.alphaValue = 0.98
        
        let contentView = ContentView()
        let hostingView = NSHostingView(rootView: contentView)
        window.contentView = hostingView
        
        if let screen = window.screen {
            let screenRect = screen.visibleFrame
            let windowSize = window.frame.size
            window.setFrameOrigin(NSPoint(
                x: (screenRect.width - windowSize.width) / 2,
                y: screenRect.maxY - windowSize.height - 100
            ))
        }
        
        self.quickWindow = window
    }
    
    private func setupAndShowBrowserWindow() {
        let window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 600, height: 400),
            styleMask: [.titled, .closable, .miniaturizable, .resizable],
            backing: .buffered,
            defer: false
        )
        window.title = "Thoughts Browser"
        window.level = .floating
        window.contentView = NSHostingView(rootView: ThoughtBrowserView())
        window.center()
        
        // Ensure app is in regular mode for proper window management
        NSApp.setActivationPolicy(.regular)
        
        // Bring window and app to front
        NSApp.activate(ignoringOtherApps: true)
        window.makeKeyAndOrderFront(nil)
        window.orderFrontRegardless()
        
        self.browserWindow = window
    }
    
    @objc func showBrowser(_ sender: AnyObject?) {
        if let window = browserWindow {
            window.makeKeyAndOrderFront(nil)
        } else {
            setupAndShowBrowserWindow()
        }
        NSApp.activate(ignoringOtherApps: true)
    }
    
    @objc func toggleQuickWindow(_ sender: AnyObject?) {
        if let window = quickWindow {
            if window.isVisible {
                window.orderOut(nil)
            } else {
                window.makeKeyAndOrderFront(nil)
                NSApp.activate(ignoringOtherApps: true)
            }
        }
    }
} 

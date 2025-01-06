import SwiftUI
import AppKit
import KeyboardShortcuts

let QUICK_PANEL_WIDTH = 400
let QUICK_PANEL_HEIGHT = 36
let QUICK_PANEL_LINE_HEIGHT = 36

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

class AppDelegate: NSObject, NSApplicationDelegate, NSWindowDelegate {
    var statusItem: NSStatusItem?
    var quickWindow: NSWindow?
    var browserWindow: NSWindow?

    func applicationDidFinishLaunching(_ notification: Notification) {
        setupStatusBarItem()
        setupQuickWindow()
        setupShortcuts()

        // Start in accessory mode (hidden from dock)
        removeFromDock()
    }

    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
        setupAndShowBrowserWindow()
        return false
    }

    // MARK: - Dock Management
    private func showInDock() {
        NSApp.setActivationPolicy(.regular)
    }

    private func removeFromDock() {
        NSApp.setActivationPolicy(.accessory)
    }

    @objc func showBrowser(_ sender: AnyObject?) {
        showInDock()
        setupAndShowBrowserWindow()
        NSApp.activate(ignoringOtherApps: true)
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
        window.isReleasedWhenClosed = false  // Let ARC manage the window's lifecycle
        window.contentView = NSHostingView(rootView: ThoughtBrowserView())
        window.center()

        window.delegate = self
        window.makeKeyAndOrderFront(nil)
        window.orderFrontRegardless()

        self.browserWindow = window
    }

    @objc func windowWillClose(_ notification: Notification) {
        if notification.object as? NSWindow == browserWindow {
            browserWindow = nil
            removeFromDock()
        }
    }

    private func setupStatusBarItem() {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        if let button = statusItem?.button {
            button.image = NSImage(systemSymbolName: "cloud.fill", accessibilityDescription: "Thoughts")
            button.action = #selector(showBrowser(_:))
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
            contentRect: NSRect(x: 0, y: 0, width: QUICK_PANEL_WIDTH, height: QUICK_PANEL_HEIGHT),
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
                x: screenRect.width/2 - windowSize.width/2,
                y: screenRect.maxY - windowSize.height - 100
            ))
        }

        self.quickWindow = window
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

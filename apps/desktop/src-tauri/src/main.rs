use tauri::Manager;
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

fn toggle_launchbar(app: &tauri::AppHandle) {
    let window = app
        .get_webview_window("quick-panel")
        .expect("Did you label your window?");
    if let Ok(true) = window.is_visible() {
        let _ = window.hide();
    } else {
        let _ = window.show();
        let _ = window.set_focus();
        window.set_always_on_top(true).unwrap();
    }
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let window = app.get_webview_window("quick-panel").unwrap();

            // Configure window to be non-activating, always on top, and movable
            window.set_decorations(false).unwrap();
            window.set_always_on_top(true).unwrap();

            // Set up window to close when it loses focus
            let window_clone = window.clone();
            window.on_window_event(move |event| match event {
                tauri::WindowEvent::Focused(focused) => {
                    if !focused {
                        let _ = window_clone.hide();
                    }
                }
                _ => {}
            });

            #[cfg(debug_assertions)]
            {
                window.open_devtools();
                window.close_devtools();
            }

            // Define shortcuts
            let alt_space_shortcut = Shortcut::new(Some(Modifiers::ALT), Code::Space);

            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            // Register the plugin with handlers
            app.handle().plugin(
                tauri_plugin_global_shortcut::Builder::new()
                    .with_handler(move |app, shortcut, event| {
                        if shortcut == &alt_space_shortcut {
                            match event.state() {
                                ShortcutState::Pressed => {
                                    toggle_launchbar(app);
                                }
                                ShortcutState::Released => {
                                    // Handle release if needed
                                }
                            }
                        }
                    })
                    .build(),
            )?;
            app.global_shortcut().register(alt_space_shortcut)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

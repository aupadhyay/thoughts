use tauri::{Manager, WindowEvent};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

fn toggle_launchbar(app: &tauri::AppHandle) {
    let window = app
        .get_webview_window("quick-panel")
        .expect("Did you label your window?");
    if let Ok(true) = window.is_visible() {
        let _ = window.hide();
    } else {
        let _ = window.show();
    }
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // Define shortcuts
            let cmd_d_shortcut = Shortcut::new(Some(Modifiers::CONTROL), Code::KeyD);
            let alt_space_shortcut = Shortcut::new(Some(Modifiers::ALT), Code::Space);

            // Register the plugin with handlers
            app.handle().plugin(
                tauri_plugin_global_shortcut::Builder::new()
                    .with_handler(move |app, shortcut, event| {
                        if shortcut == &cmd_d_shortcut || shortcut == &alt_space_shortcut {
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

            // Register the shortcuts
            app.global_shortcut().register(cmd_d_shortcut)?;
            app.global_shortcut().register(alt_space_shortcut)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

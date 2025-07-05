use tauri::{
    image::Image,
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager,
};

use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

#[tauri::command]
fn close_quickpanel(app: tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("quick-panel") {
        window.hide().unwrap();
    }
}

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
            let app_handle = app.app_handle();

            let icon = Image::from_bytes(include_bytes!("../icons/32x32.png"))?;

            let open_i = MenuItem::with_id(app, "open", "Open", true, Some("⌥+Space"))?;
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&open_i, &quit_i])?;

            let _tray = TrayIconBuilder::with_id("tray")
                .icon(icon)
                .icon_as_template(true)
                .menu(&menu)
                .on_menu_event(|tray, event| {
                    let app_handle = tray.app_handle();
                    match event.id().as_ref() {
                        "open" => {
                            let window = app_handle.get_webview_window("main").unwrap();
                            window.show().unwrap();
                            window.set_focus().unwrap();
                        }
                        "quit" => app_handle.exit(0),
                        _ => {}
                    }
                })
                .build(app_handle)
                .unwrap();

            let window = app.get_webview_window("quick-panel").unwrap();

            // Configure window to be non-activating, always on top, and movable
            window.set_decorations(false).unwrap();
            window.set_always_on_top(true).unwrap();

            // Set up window to close when it loses focus
            // let window_clone = window.clone();
            // window.on_window_event(move |event| match event {
            //     tauri::WindowEvent::Focused(focused) => {
            //         if !focused {
            //             let _ = window_clone.hide();
            //         }
            //     }
            //     _ => {}
            // });

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
        .invoke_handler(tauri::generate_handler![close_quickpanel])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

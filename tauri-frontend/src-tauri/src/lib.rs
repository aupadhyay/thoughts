use tauri::Wry;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{TrayIconBuilder, TrayIconEvent},
    Manager, WindowEvent,
};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

#[tauri::command]
fn toggle_window(app: tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("quick-panel") {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
        } else {
            let _ = window.show();
            let _ = window.set_focus();
        }
    }
}

#[tauri::command]
fn save_thought(content: String) -> Result<String, String> {
    // TODO: Call your backend API to save the thought
    println!("Saving thought: {}", content);
    Ok("Thought saved successfully".to_string())
}

fn create_tray_menu(app: &tauri::App) -> Result<Menu<Wry>, tauri::Error> {
    // Create menu items
    let show_hide = MenuItem::with_id(app, "show_hide", "Show/Hide", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

    // Create the menu
    Menu::<Wry>::with_items(app, &[&show_hide, &quit])
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Create tray menu
            let tray_menu = create_tray_menu(app)?;

            // Create system tray
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&tray_menu)
                .tooltip("Thoughts")
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| match event.id.0.as_str() {
                    "show_hide" => {
                        toggle_window(app.clone());
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| match event {
                    TrayIconEvent::Click {
                        button: tauri::tray::MouseButton::Left,
                        button_state: tauri::tray::MouseButtonState::Up,
                        ..
                    } => {
                        let app = tray.app_handle();
                        toggle_window(app.clone());
                    }
                    TrayIconEvent::DoubleClick { .. } => {
                        println!("Tray icon double clicked");
                    }
                    _ => {}
                })
                .build(app)?;

            // Register global shortcut
            let alt_space_shortcut = Shortcut::new(Some(Modifiers::ALT), Code::Space);
            app.handle().plugin(
                tauri_plugin_global_shortcut::Builder::new()
                    .with_handler(move |app, shortcut, event| {
                        if shortcut == &alt_space_shortcut {
                            match event.state() {
                                ShortcutState::Pressed => {
                                    toggle_window(app.clone());
                                }
                                ShortcutState::Released => {}
                            }
                        }
                    })
                    .build(),
            )?;

            app.global_shortcut().register(alt_space_shortcut)?;

            // Hide window initially
            if let Some(window) = app.get_webview_window("quick-panel") {
                let _ = window.hide();
            }

            Ok(())
        })
        .on_window_event(|window, event| match event {
            WindowEvent::Focused(false) => {
                if window.label() == "quick-panel" {
                    let _ = window.hide();
                }
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![toggle_window, save_thought])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

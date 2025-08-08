use std::path::PathBuf;
use std::process::Command;

fn get_script_path(script_name: &str) -> PathBuf {
    let mut path = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    path.push("scripts");
    path.push("applescript");
    path.push(script_name);
    path
}

fn run_script(script_path: &PathBuf) -> Result<String, tauri::Error> {
    let output = Command::new("osascript")
        .arg(script_path)
        .output()
        .map_err(|e| tauri::Error::Io(e))?;
    Ok(String::from_utf8_lossy(&output.stdout).trim().to_owned())
}

#[tauri::command]
pub fn active_arc_url() -> Result<String, tauri::Error> {
    let script_path = get_script_path("get_arc_url.applescript");
    run_script(&script_path)
}

#[derive(serde::Deserialize, serde::Serialize)]
pub struct SpotifyTrackInfo {
    artist: String,
    track: String,
}

#[derive(serde::Deserialize, serde::Serialize)]
pub struct FocusedAppInfo {
    name: String,
    #[serde(rename = "bundleId")]
    bundle_id: String,
}

#[tauri::command]
pub fn get_spotify_track() -> Result<SpotifyTrackInfo, tauri::Error> {
    let script_path = get_script_path("get_spotify_track.applescript");
    let output_str = run_script(&script_path)?;

    let track_info: SpotifyTrackInfo = serde_json::from_str(&output_str)?;

    Ok(track_info)
}

#[tauri::command]
pub fn get_focused_app() -> Result<FocusedAppInfo, tauri::Error> {
    let script_path = get_script_path("get_focused_app.applescript");
    let output_str = run_script(&script_path)?;

    let app_info: FocusedAppInfo = serde_json::from_str(&output_str)?;

    Ok(app_info)
}

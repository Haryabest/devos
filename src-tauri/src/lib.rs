// DevOS library crate — required by Tauri v2 build system.
// Native commands and plugins are added here as the app grows.

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .run(tauri::generate_context!())
        .expect("error while running DevOS");
}

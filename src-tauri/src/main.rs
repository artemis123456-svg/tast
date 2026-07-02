#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

#[tauri::command]
fn get_system_resolution() -> String {
  // Safe native query fallback for resolution
  "1440x900".to_string()
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![get_system_resolution])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

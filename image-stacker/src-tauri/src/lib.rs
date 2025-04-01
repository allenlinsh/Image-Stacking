// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::{Serialize, Deserialize};
use image::GenericImageView;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize)]
pub struct ImageInfo {
    path: String,
    width: u32,
    height: u32,
}

#[tauri::command]
async fn get_image_info(path: String) -> Result<ImageInfo, String> {
    // First check if the file exists
    if !Path::new(&path).exists() {
        return Err(format!("File does not exist: {}", path));
    }

    // Try to open and get image info with detailed error handling
    match image::open(&path) {
        Ok(img) => {
            let dimensions = img.dimensions();
            Ok(ImageInfo {
                path,
                width: dimensions.0,
                height: dimensions.1,
            })
        }
        Err(e) => {
            Err(format!("Failed to load image '{}': {}", path, e))
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            get_image_info,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use acc_pitwall::*;

fn main() {
    run();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            connect,
            disconnect,
            get_connection_status,
            test_connection,
            deploy,
            get_preset_list,
            save_preset_cmd,
            load_preset_cmd,
            update_preset_cmd,
            delete_preset_cmd,
            rename_preset_cmd,
            get_app_data_dir,
            get_server_list,
            save_server_cmd,
            load_server_cmd,
            delete_server_cmd,
            rename_server_cmd,
            download_acc_server_cmd,
            upload_acc_server_local_cmd,
            start_acc_server_cmd,
            stop_acc_server_cmd,
            check_acc_server_status_cmd,
            download_results_cmd,
            delete_config_folder,
            download_results_filtered_cmd,
            pull_server_config_cmd,
            get_app_exe_dir,
            get_app_resource_dir,
            get_lfm_bop_cached,
            get_lfm_bop_cache_status,
            clear_lfm_bop_cache,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

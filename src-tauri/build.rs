fn main() {
    println!("cargo:rerun-if-changed=../dist/scripts");
    tauri_build::build()
}

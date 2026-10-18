pub fn load_test_html(compressed: &[u8]) -> String {
    use flate2::read::GzDecoder;
    use std::io::Read;

    let mut decoder = GzDecoder::new(compressed);
    let mut html = String::new();
    decoder
        .read_to_string(&mut html)
        .expect("failed to decompress test HTML resource");
    html
}

#[path = "support/http.rs"]
pub mod http;

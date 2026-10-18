use super::*;
use crate::test_support::load_test_html;

fn normalize_whitespace(value: &mut serde_json::Value) {
    match value {
        serde_json::Value::String(text) => {
            *text = text.split_whitespace().collect::<Vec<_>>().join(" ");
        }
        serde_json::Value::Array(items) => {
            for item in items {
                normalize_whitespace(item);
            }
        }
        serde_json::Value::Object(fields) => {
            for (key, item) in fields.iter_mut() {
                normalize_whitespace(item);
                if key == "选项"
                    && let serde_json::Value::Array(options) = item
                {
                    for option in options {
                        if let serde_json::Value::String(text) = option {
                            let mut chars = text.chars();
                            if let Some(label @ 'A'..='D') = chars.next() {
                                *text = format!("{}{}", label, chars.as_str().trim_start());
                            }
                        }
                    }
                }
            }
        }
        _ => {}
    }
}

#[test]
fn test_extraction() {
    let compressed = include_bytes!("../../../assets/course-page/webpage.html.gz");
    let html = load_test_html(compressed);
    let raw = HtmlExtractPayload::new(&html).expect("Failed to parse HTML");

    let expected_json: serde_json::Value =
        serde_json::from_str(include_str!("../../../assets/course-page/questions.json"))
            .expect("Invalid expected questions.json");
    let mut actual_json =
        serde_json::to_value(&raw.questions).expect("Serialize parsed questions failed");
    let mut expected_json = expected_json;
    normalize_whitespace(&mut expected_json);
    normalize_whitespace(&mut actual_json);
    assert_eq!(
        expected_json, actual_json,
        "Parsed questions differ from questions.json after whitespace normalization"
    );

    let expected_ttf = include_bytes!("../../../assets/course-page/cxs-font.ttf");
    let actual_ttf = raw.font.as_ref().expect("No font extracted from HTML");
    assert_eq!(
        expected_ttf,
        actual_ttf.as_slice(),
        "Extracted font bytes differ from cxs-font.ttf"
    );

    let blank = HtmlExtractPayload::new("");
    assert!(blank.is_err(), "Empty HTML should return an error");
}

use super::*;
use serde_json::to_value;
use std::collections::HashMap;

#[test]
fn test_map_basic() {
    let mut font_map = HashMap::new();
    font_map.insert('a', 'x');
    font_map.insert('b', 'y');
    let out = map("abc", &font_map);
    assert_eq!(out, "xyc");
}

#[test]
fn test_map_unmapped_chars_unchanged() {
    let font_map = HashMap::new();
    let out = map("héllo", &font_map);
    assert_eq!(out, "héllo");
}

#[test]
fn test_decrypt_no_font_returns_same_questions() {
    let q1 = Question {
        id: "1".into(),
        kind: "single".into(),
        stem: "What is 1+1?".into(),
        options: vec!["A. 1".into(), "B. 2".into()],
        images: Vec::new(),
    };
    let q2 = Question {
        id: "2".into(),
        kind: "multi".into(),
        stem: "Choose colors".into(),
        options: vec!["Red".into(), "Blue".into()],
        images: Vec::new(),
    };

    let questions = vec![q1.clone(), q2.clone()];
    let payload = QuestionPayload {
        questions: questions.clone(),
        font: None,
    };
    let decrypted = decrypt(payload);

    let expected = to_value(&questions).expect("serialize expected failed");
    let actual = to_value(&decrypted).expect("serialize actual failed");
    assert_eq!(expected, actual);
}

#[test]
fn decrypts_course_page_to_expected_questions() {
    let raw = QuestionPayload {
        questions: serde_json::from_str(include_str!("../../../assets/course-page/questions.json"))
            .unwrap(),
        font: Some(include_bytes!("../../../assets/course-page/cxs-font.ttf").to_vec()),
    };
    let decrypted = decrypt(raw);
    let expected: serde_json::Value =
        serde_json::from_str(include_str!("../../../assets/course-page/decrypted.json")).unwrap();
    assert_eq!(to_value(decrypted).unwrap(), expected);
}

use super::*;

#[test]
fn strict_answers_validate_ids_content_and_restore_order() {
    let questions: Vec<Question> = (1..=2)
        .map(|id| Question {
            id: id.to_string(),
            kind: "single".into(),
            stem: "Choose A".into(),
            options: vec!["A".into()],
        })
        .collect();
    let answers = parse(r#"{"answers":[{"index":"2","explanation":"","content":"B"},{"index":"1","explanation":"","content":"A"}]}"#, &questions).unwrap();
    assert_eq!(answers[0].index, "1");
    assert_eq!(answers[1].content, "B");
    for text in [
        r#"[{"index":"1","explanation":"unescaped "quote"","content":"A"}]"#,
        r#"[{"index":"1","explanation":"","content":"A"}]"#,
        r#"[{"index":"1","explanation":"","content":"A"},{"index":"1","explanation":"","content":"A"}]"#,
        r#"[{"index":"1","explanation":"","content":"A"},{"index":"3","explanation":"","content":"A"}]"#,
        r#"[{"index":"1","explanation":"","content":"A"},{"index":"2","explanation":"","content":" "}]"#,
    ] {
        assert!(parse(text, &questions).unwrap_err().is::<AnswerError>());
    }
}

use super::*;

#[test]
fn builds_tags_url_from_chat_endpoint() {
    assert_eq!(
        tags_url("http://localhost:11434/api/chat"),
        "http://localhost:11434/api/tags"
    );
}

#[test]
fn parses_ollama_models() {
    let body = r#"{
        "models": [
            { "name": "qwen3:8b", "model": "qwen3:8b" },
            { "name": "llama3.2:3b", "model": "llama3.2:3b" }
        ]
    }"#;

    assert_eq!(
        parse_models(body).unwrap(),
        vec!["qwen3:8b".to_string(), "llama3.2:3b".to_string()]
    );
}

#[test]
fn rejects_invalid_ollama_response() {
    assert!(parse_models("{\"models\": null}").is_err());
}

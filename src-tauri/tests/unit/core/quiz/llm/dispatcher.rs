use super::*;
use crate::config::llm::ApiKey;
use crate::test_support::http::{response, serve};
use serde_json::json;

#[tokio::test]
async fn preset_chat_requests_preserve_options_and_read_answer_arrays() {
    for (id, path, model, thinking) in [
        (
            "bailian",
            "/compatible-mode/v1/chat/completions",
            "qwen3.8-flash",
            Some(false),
        ),
        (
            "siliconflow",
            "/v1/chat/completions",
            "deepseek-ai/DeepSeek-V4.1-Flash",
            None,
        ),
    ] {
        let mut provider = crate::config::llm::LLMConfig::default()
            .providers
            .into_inner()
            .remove(id)
            .unwrap();
        let body = response(
            &provider.protocol,
            json!([{"index":"1","explanation":"mock","content":"A"}]),
        );
        let (url, request) = serve(200, body).await;
        let preset_path = tauri::Url::parse(&provider.base_url)
            .unwrap()
            .path()
            .to_owned();
        provider.base_url = format!("{url}{preset_path}");
        provider.api_key = Some(ApiKey::new("mock-api-key".into()).unwrap());

        let answers = solve(
            &provider,
            vec![Question {
                id: "1".into(),
                kind: "single".into(),
                stem: "Choose A".into(),
                options: vec!["A".into()],
            }],
        )
        .await
        .unwrap();
        let request = request.await.unwrap();
        assert!(request.head.starts_with(&format!("POST {path} ")));
        assert_eq!(request.headers["authorization"], "Bearer mock-api-key");
        assert_eq!(request.body["model"], model);
        assert_eq!(
            request
                .body
                .get("enable_thinking")
                .and_then(serde_json::Value::as_bool),
            thinking
        );
        assert_eq!(request.body["stream"], false);
        assert!(request.body.get("extra_body").is_none());
        assert_eq!(answers.len(), 1);
        assert_eq!(answers[0].content, "A");
    }
}

#[tokio::test]
async fn sends_protocol_requests_with_application_headers() {
    for protocol in [
        LLMProtocol::OpenAIChatCompletions,
        LLMProtocol::OpenAIResponses,
        LLMProtocol::GoogleGemini,
    ] {
        let body = response(
            &protocol,
            json!([{"index":"1","explanation":"mock","content":"A"}]),
        );
        let (url, request) = serve(200, body).await;
        let path = match protocol {
            LLMProtocol::OpenAIChatCompletions => "/v1/chat/completions",
            LLMProtocol::OpenAIResponses => "/v1/responses",
            LLMProtocol::GoogleGemini => "/models",
        };
        let provider = LLMProvider {
            name: "Local mock".into(),
            is_custom: true,
            protocol,
            base_url: format!("{url}{path}"),
            api_key: Some(ApiKey::new("mock-api-key".into()).unwrap()),
            models: vec!["mock-model".into()],
            chosen_model: Some(0),
            extra_body: None,
        };
        let answers = solve(
            &provider,
            vec![Question {
                id: "1".into(),
                kind: "???".into(),
                stem: "?? A".into(),
                options: vec!["A".into()],
            }],
        )
        .await
        .unwrap();
        let request = request.await.unwrap();
        let head = request.head;
        let headers = request.headers;
        let body = request.body;
        assert_eq!(
            headers["user-agent"],
            concat!("uXueScript/", env!("CARGO_PKG_VERSION"))
        );
        assert_eq!(headers["accept"], "application/json");
        assert_eq!(headers["content-type"], "application/json");
        assert!(!headers.contains_key("accept-language"));
        match provider.protocol {
            LLMProtocol::OpenAIChatCompletions => {
                assert!(head.starts_with("POST /v1/chat/completions "));
                assert_eq!(headers["authorization"], "Bearer mock-api-key");
                assert_eq!(body["model"], "mock-model");
                assert!(body["messages"].is_array());
            }
            LLMProtocol::OpenAIResponses => {
                assert!(head.starts_with("POST /v1/responses "));
                assert_eq!(headers["authorization"], "Bearer mock-api-key");
                assert_eq!(body["model"], "mock-model");
                assert!(body["input"].is_string());
            }
            LLMProtocol::GoogleGemini => {
                assert!(head.starts_with("POST /models/mock-model:generateContent "));
                assert_eq!(headers["x-goog-api-key"], "mock-api-key");
                assert!(body["contents"].is_array());
            }
        }
        assert_eq!(answers.len(), 1);
        assert_eq!(answers[0].index, "1");
        assert_eq!(answers[0].content, "A");
    }
}

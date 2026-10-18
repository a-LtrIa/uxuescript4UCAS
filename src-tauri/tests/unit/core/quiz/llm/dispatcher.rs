use super::*;
use crate::config::llm::ApiKey;
use crate::test_support::http::{response, serve};
use serde_json::json;

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

use super::*;

#[tokio::test]
#[ignore = "requires local Ollama service"]
async fn fetches_models_from_local_ollama() {
    let models = fetch_models("http://localhost:11434/api/chat").await;
    assert!(!models.is_empty());
}

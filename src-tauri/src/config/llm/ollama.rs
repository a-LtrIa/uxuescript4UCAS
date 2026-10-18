use serde::Deserialize;

#[derive(Deserialize)]
struct OllamaTagsResponse {
    models: Vec<OllamaModelEntry>,
}

#[derive(Deserialize)]
struct OllamaModelEntry {
    model: String,
}

fn tags_url(base_url: &str) -> String {
    format!(
        "{}/tags",
        &base_url[..base_url.rfind('/').unwrap_or(base_url.len())]
    )
}

fn parse_models(body: &str) -> Result<Vec<String>, serde_json::Error> {
    serde_json::from_str::<OllamaTagsResponse>(body)
        .map(|data| data.models.into_iter().map(|model| model.model).collect())
}

/// 从本地 Ollama 服务拉取可用模型列表。
/// 连接失败、响应体读取失败或模型列表解析失败时静默返回空 Vec。
pub async fn fetch_models(base_url: &str) -> Vec<String> {
    let client = reqwest::Client::new();
    let tags_url = tags_url(base_url);

    let resp = match client.get(&tags_url).send().await {
        Ok(r) => r,
        Err(_) => return vec![],
    };

    resp.text()
        .await
        .ok()
        .and_then(|body| parse_models(&body).ok())
        .unwrap_or_default()
}

#[cfg(test)]
#[path = "../../../tests/unit/config/llm/ollama.rs"]
mod tests;

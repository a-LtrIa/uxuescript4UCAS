use super::{answers::parse, media::Image, pool::RequestPool};
use crate::config::llm::LLMProvider;
use crate::core::quiz::{
    Question,
    llm::{AnswerItem, SYSTEM_PROMPT},
};
use anyhow::Result;

/// OpenAI /v1/responses 接口处理
pub(super) async fn solve(
    client: &reqwest::Client,
    provider: &LLMProvider,
    model: &str,
    questions: &[Question],
    images: &[Image],
    pool: &RequestPool,
) -> Result<Vec<AnswerItem>> {
    let mut request_body: serde_json::Value =
        serde_json::from_str(include_str!("../req_body/openai.json"))?;
    request_body["model"] = serde_json::json!(model);
    request_body["instructions"] = serde_json::json!(format!(
        "{SYSTEM_PROMPT}\n本次输出遵循 JSON Schema，将答案数组放在 answers 字段中。"
    ));
    let question_text = serde_json::to_string(questions)?;
    request_body["input"] = if images.is_empty() {
        serde_json::json!(question_text)
    } else {
        let mut content = vec![serde_json::json!({ "type": "input_text", "text": question_text })];
        for image in images {
            content.push(serde_json::json!({
                "type": "input_text",
                "text": format!("题号 {} 的 [{}]", image.question_id, image.marker)
            }));
            content.push(serde_json::json!({
                "type": "input_image",
                "image_url": image.data_url()
            }));
        }
        serde_json::json!([{ "role": "user", "content": content }])
    };

    let response = pool
        .send(|| {
            let mut req = client.post(&provider.base_url);
            if let Some(key) = provider.api_key.as_ref().map(|key| key.expose())
                && !key.trim().is_empty()
            {
                req = req.header("Authorization", format!("Bearer {}", key));
            }
            req.header("Content-Type", "application/json")
                .json(&request_body)
        })
        .await?;

    if !response.status().is_success() {
        anyhow::bail!(
            "OpenAI API 错误 ({}): {}",
            response.status(),
            response.text().await?
        );
    }

    let data: serde_json::Value = response.json().await?;
    let content = data
        .pointer("/output/1/content/0/text")
        .and_then(|v| v.as_str())
        .or_else(|| {
            data["output"]
                .as_array()?
                .iter()
                .find(|o| o["type"] == "message")?
                .pointer("/content/0/text")?
                .as_str()
        })
        .ok_or_else(|| anyhow::anyhow!("无法从 OpenAI 响应提取文本。原始响应: {}", data))?;

    parse(content, questions)
}

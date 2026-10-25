mod dispatcher;

pub use dispatcher::solve;

use super::Question;

use anyhow::Result;
use serde::{Deserialize, Serialize};
use specta::Type;

const SYSTEM_PROMPT: &str = include_str!("./system_prompt.txt");

#[derive(Serialize, Deserialize, Debug, Type)]
pub struct AnswerItem {
    pub index: String,
    pub explanation: String,
    pub content: String,
}

pub fn validate(model: &str, questions: &[Question]) -> Result<()> {
    if questions.is_empty() {
        anyhow::bail!("接收到空的题目列表");
    }
    if model.is_empty() {
        anyhow::bail!("未选择 AI 模型");
    }
    Ok(())
}

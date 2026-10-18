mod html;
mod mapper;
mod typr;

pub mod llm;

use html::HtmlExtractPayload;
pub use html::Question;
use llm::AnswerItem;
use mapper::decrypt;

use crate::config::CONFIG;
use anyhow::Result;

/// 使用字体哈希字典解密混淆题目，并结合当前全局配置的大语言模型自动生成测验答案。
pub async fn solve(html: &str) -> Result<Vec<AnswerItem>> {
    let decrypted = decrypt(HtmlExtractPayload::new(html)?);
    if decrypted.is_empty() {
        anyhow::bail!("题目解析失败");
    }

    let active_id = CONFIG.llm.active_provider.lock().clone();
    let provider = CONFIG
        .llm
        .providers
        .lock()
        .get(&active_id)
        .cloned()
        .ok_or_else(|| anyhow::anyhow!("大模型提供商 [{}] 不存在", active_id))?;
    llm::solve(&provider, decrypted).await
}

pub(crate) mod ollama;

use anyhow::{bail, Result};
use parking_lot::Mutex;
use serde::{Deserialize, Serialize};
use specta::Type;
use std::collections::HashMap;
use std::fmt;

/// API 密钥。
///
/// 序列化时保持原始字符串格式，以兼容现有配置文件；格式化输出始终脱敏，
/// 防止在日志中直接打印密钥明文。
#[derive(Serialize, Deserialize, Clone, PartialEq, Eq, Type)]
#[serde(transparent)]
pub struct ApiKey(String);

const MIN_API_KEY_LENGTH: usize = 12;

impl ApiKey {
    pub fn new(value: String) -> Result<Self> {
        let value = value.trim();

        if !value.is_ascii() {
            bail!("API Key 必须为 ASCII 字符");
        }

        if value.len() < MIN_API_KEY_LENGTH {
            bail!("API Key 长度不能少于 12 个字符");
        }

        Ok(Self(value.to_owned()))
    }
    pub fn expose(&self) -> &str {
        &self.0
    }
}

impl fmt::Display for ApiKey {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let buffer = if self.0.len() < 12 {
            String::from("************")
        } else {
            format!("{}****{}", &self.0[..4], &self.0[self.0.len() - 4..])
        };
        write!(f, "{}", buffer)
    }
}

impl fmt::Debug for ApiKey {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "ApiKey({})", self)
    }
}

/// 支持的大模型 API 发包协议族
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, Hash, Type)]
pub enum LLMProtocol {
    OpenAIChatCompletions, // 通用 OpenAI 兼容协议 (Chat Completions)
    OpenAIResponses,       // OpenAI Responses 特殊协议 (/v1/responses)
    GoogleGemini,          // Google Gemini 协议 (:generateContent)
}

/// 统一的大模型提供商结构体（内置与用户自定义提供商通用纯数据 DTO）
#[derive(Serialize, Deserialize, Debug, Clone, Type)]
#[serde(rename_all = "camelCase")]
pub struct LLMProvider {
    pub name: String,            // 提供商显示名称 (如 "DeepSeek 官方", "我的私有中转站")
    pub is_custom: bool,         // 是否为用户自定义的提供商
    pub protocol: LLMProtocol,   // 采用的 API 协议族
    pub base_url: String,        // 接口基础 URL
    pub api_key: Option<ApiKey>, // API Key (Option 允许免 Key / 未配置)
    pub models: Vec<String>,     // 支持的模型列表
    #[specta(type = Option<u32>)]
    pub chosen_model: Option<usize>, // 当前选择的模型在 models 列表中的索引
    #[serde(default)]
    #[specta(skip)]
    pub extra_body: Option<serde_json::Value>, // 协议特定额外 Body 参数 (如 temperature, stream)
}

/// 应用全局大语言模型配置
#[derive(Serialize, Deserialize, Debug)]
#[serde(default)]
pub struct LLMConfig {
    pub active_provider: Mutex<String>,
    pub providers: Mutex<HashMap<String, LLMProvider>>,
}

impl Default for LLMConfig {
    fn default() -> Self {
        let providers: HashMap<String, LLMProvider> =
            serde_json::from_str(include_str!("./llm/providers.default.json"))
                .expect("无法解析默认 LLM 提供商预设配置文件 (providers.default.json)");

        Self {
            active_provider: Mutex::new("bigmodel".to_string()),
            providers: Mutex::new(providers),
        }
    }
}

#[cfg(test)]
#[path = "../../tests/unit/config/llm.rs"]
mod tests;

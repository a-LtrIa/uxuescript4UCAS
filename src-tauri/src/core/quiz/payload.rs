use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone, specta::Type)]
pub struct Question {
    /// 页面显示题号，不是平台内部题目 ID。
    pub id: String,
    pub kind: String,
    pub stem: String,
    pub options: Vec<String>,
}

/// 前端采集的题目与可选字体；分页方式和平台内部 ID 不进入求解协议。
#[derive(Serialize, Deserialize, Debug, Clone, specta::Type)]
pub struct QuestionPayload {
    pub questions: Vec<Question>,
    pub font: Option<Vec<u8>>,
}

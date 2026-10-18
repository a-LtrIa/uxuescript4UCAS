use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Serialize, Deserialize, Debug, Clone, Copy, Default, PartialEq, Type)]
#[serde(rename_all = "lowercase")]
pub enum LabelLanguage {
    #[default]
    En,
    Zh,
}

#[derive(Serialize, Deserialize, Debug, Clone, Copy, Default, Type)]
#[serde(default, rename_all = "camelCase")]
pub struct GeneralConfig {
    pub label_language: LabelLanguage,
}

#[cfg(test)]
#[path = "../../tests/unit/config/general.rs"]
mod tests;

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
mod tests {
    use super::*;

    #[test]
    fn label_language_defaults_and_round_trips() {
        let defaults: GeneralConfig = toml::from_str("").unwrap();
        assert_eq!(defaults.label_language, LabelLanguage::En);
        for language in [LabelLanguage::En, LabelLanguage::Zh] {
            let config = GeneralConfig {
                label_language: language,
            };
            let saved = toml::to_string(&config).unwrap();
            let loaded: GeneralConfig = toml::from_str(&saved).unwrap();
            assert_eq!(loaded.label_language, language);
        }
    }
}

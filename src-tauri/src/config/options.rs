use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Serialize, Deserialize, Debug, Clone, Copy, Type)]
#[serde(default, rename_all = "camelCase")] // 将 Rust 下划线命名（snake_case）自动映射为 TypeScript 驼峰命名（camelCase）
pub struct OptionsConfig {
    pub mute_webview: bool,
    pub lock_speed: Option<f32>,
    pub switching_cd: Option<f32>,
    pub quiz_review: bool,
}

impl Default for OptionsConfig {
    fn default() -> Self {
        Self {
            mute_webview: true,
            lock_speed: None,
            switching_cd: None,
            quiz_review: false,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_options_config_serde_and_default() {
        let opts = OptionsConfig::default();
        assert!(opts.mute_webview);
        assert_eq!(opts.lock_speed, None);
        assert_eq!(opts.switching_cd, None);
        assert!(!opts.quiz_review);

        let json = serde_json::to_string(&opts).unwrap();
        assert!(json.contains("\"muteWebview\":true"));
        assert!(json.contains("\"lockSpeed\":null"));
        assert!(json.contains("\"switchingCd\":null"));

        let deserialized: OptionsConfig = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.lock_speed, None);
        let configured: OptionsConfig =
            serde_json::from_str(r#"{"lockSpeed":1.5,"switchingCd":2.0,"quizReview":true}"#)
                .unwrap();
        assert_eq!(configured.lock_speed, Some(1.5));
        assert_eq!(configured.switching_cd, Some(2.0));
        assert!(configured.quiz_review);
        for options in [opts, configured] {
            let saved = toml::to_string(&options).unwrap();
            let loaded: OptionsConfig = toml::from_str(&saved).unwrap();
            assert_eq!(loaded.lock_speed, options.lock_speed);
            assert_eq!(loaded.switching_cd, options.switching_cd);
            assert_eq!(loaded.quiz_review, options.quiz_review);
        }
        for legacy in [
            "{}",
            r#"{"speedLock":false,"speedValue":2.0}"#,
            r#"{"speedLock":true,"speedValue":2.0}"#,
        ] {
            let options: OptionsConfig = serde_json::from_str(legacy).unwrap();
            assert_eq!(options.lock_speed, None);
            assert_eq!(options.switching_cd, None);
            assert!(!options.quiz_review);
        }
    }
}

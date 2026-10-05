pub mod llm;
pub mod metadata;
pub mod options;
pub mod path;
pub mod theme;

use llm::LLMConfig;
use metadata::MetadataConfig;
use options::OptionsConfig;
use path::PathsConfig;
use theme::ThemeConfig;

use anyhow::Result;
use parking_lot::Mutex;
use serde::{Deserialize, Serialize};
use std::sync::LazyLock;

#[derive(Serialize, Deserialize, Debug, Default)]
#[serde(default)]
pub struct Config {
    pub metadata: MetadataConfig,
    pub paths: PathsConfig,
    pub options: Mutex<OptionsConfig>,
    pub theme: Mutex<ThemeConfig>,
    pub llm: LLMConfig,
}

impl Config {
    // 此处日志系统尚未初始化完成，读取配置文件失败时将直接降级回退至默认配置。
    fn load() -> Self {
        let config = Self::default();
        match toml::from_str::<Config>(
            std::fs::read_to_string(&config.paths.files["config"])
                .unwrap_or_default()
                .as_str(),
        ) {
            Ok(loaded) => Self::with_current_version(loaded, &config.metadata.version),
            Err(_) => config,
        }
    }

    fn with_current_version(mut loaded: Self, current_version: &str) -> Self {
        if loaded.metadata.version != current_version {
            loaded.metadata.version = current_version.into();
        }
        loaded
    }

    pub fn save(&self) -> Result<()> {
        std::fs::write(&self.paths.files["config"], toml::to_string_pretty(&self)?)?;
        log::info!("配置已保存到 {}", self.paths.files["config"].display());
        Ok(())
    }
}

pub static CONFIG: LazyLock<Config> = LazyLock::new(Config::load);

#[cfg(test)]
mod tests {
    use super::Config;

    #[test]
    fn loaded_config_keeps_user_settings_when_version_changes() {
        let current = Config::default();
        let mut loaded = Config::default();
        loaded.metadata.version = "2.0.1".into();
        loaded.options.lock().mute_webview = true;

        let loaded = Config::with_current_version(loaded, &current.metadata.version);

        assert_eq!(loaded.metadata.version, current.metadata.version);
        assert!(loaded.options.lock().mute_webview);
    }
}

pub mod llm;
pub mod options;
pub mod path;
pub mod theme;

use llm::LLMConfig;
use options::OptionsConfig;
use path::PathsConfig;
use theme::ThemeConfig;

use anyhow::Result;
use parking_lot::Mutex;
use serde::{Deserialize, Serialize};
use std::sync::LazyLock;

#[derive(Serialize, Deserialize, Debug)]
#[serde(default)]
pub struct Config {
    pub log_level: log::LevelFilter,
    pub paths: PathsConfig,
    pub options: Mutex<OptionsConfig>,
    pub theme: Mutex<ThemeConfig>,
    pub llm: LLMConfig,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            log_level: if cfg!(debug_assertions) {
                log::LevelFilter::Debug
            } else {
                log::LevelFilter::Info
            },
            paths: PathsConfig::default(),
            options: Mutex::new(OptionsConfig::default()),
            theme: Mutex::new(ThemeConfig::default()),
            llm: LLMConfig::default(),
        }
    }
}

impl Config {
    // 此处日志系统尚未初始化完成，读取配置文件失败时将直接降级回退至默认配置。
    fn load() -> Self {
        let config = Self::default();
        Self::parse(&std::fs::read_to_string(&config.paths.files["config"]).unwrap_or_default())
            .unwrap_or(config)
    }

    fn parse(content: &str) -> Result<Self> {
        let mut config: toml::Table = toml::from_str(content)?;
        // 旧配置把日志级别放在 metadata 中；只迁移日志级别，其余元数据由应用提供。
        if let Some(level) = config
            .remove("metadata")
            .and_then(|metadata| metadata.get("logLevel").cloned())
        {
            config.entry("log_level").or_insert(level);
        }
        Ok(config.try_into()?)
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
    fn old_metadata_only_migrates_log_level_and_preserves_user_options() {
        let loaded = Config::parse(
            r#"
            [metadata]
            author = "changed"
            title = "changed"
            version = "0.0.0"
            homeUrl = "https://example.com/"
            logLevel = "Warn"
            [options]
            muteWebview = true
        "#,
        )
        .unwrap();
        assert_eq!(loaded.log_level, log::LevelFilter::Warn);
        assert!(loaded.options.lock().mute_webview);
        let saved: toml::Table = toml::from_str(&toml::to_string(&loaded).unwrap()).unwrap();
        assert!(!saved.contains_key("metadata"));
        assert!(saved.contains_key("log_level"));
    }

    #[test]
    fn old_config_without_theme_uses_default_theme() {
        let loaded = Config::parse("[options]\nmuteWebview = true").unwrap();
        assert!(matches!(
            loaded.theme.lock().name,
            super::theme::ThemeName::Gentian
        ));
        assert!(loaded.options.lock().mute_webview);
    }

    #[test]
    fn migration_and_round_trip_preserve_selected_theme() {
        let loaded =
            Config::parse("[metadata]\nlogLevel = 'Warn'\n[theme]\nname = 'iris'").unwrap();
        let saved = toml::to_string_pretty(&loaded).unwrap();
        let reloaded = Config::parse(&saved).unwrap();
        assert!(matches!(
            reloaded.theme.lock().name,
            super::theme::ThemeName::Iris
        ));
        assert_eq!(reloaded.log_level, log::LevelFilter::Warn);
    }

    #[test]
    fn explicit_log_level_takes_precedence_over_old_metadata() {
        let loaded = Config::parse("log_level = 'Error'\n[metadata]\nlogLevel = 'Warn'").unwrap();
        assert_eq!(loaded.log_level, log::LevelFilter::Error);
    }
}

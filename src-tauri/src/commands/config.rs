pub mod llm;

use super::CommandsResult;

use crate::config::{options::OptionsConfig, path::PathsConfig, CONFIG};

#[uxs_commands::command(webview = "chaoxing")]
pub fn options() -> OptionsConfig {
    log::debug!("正在获取配置信息...");
    let options = *CONFIG.options.lock();
    log::info!("成功获取配置信息: {:?}", options);
    options
}

#[uxs_commands::command]
pub fn set_options(options: OptionsConfig) {
    log::debug!("正在设置配置信息...");
    *CONFIG.options.lock() = options;
    log::info!("成功设置配置信息: {:?}", options);
}

/// 将内存中的全局配置持久化保存至本地文件。
#[uxs_commands::command]
pub fn save_config() -> CommandsResult<()> {
    log::debug!("正在保存配置文件...");
    CONFIG.save()?;
    log::info!("成功保存配置文件");
    Ok(())
}

#[uxs_commands::command]
pub fn paths() -> PathsConfig {
    log::debug!("正在获取路径配置...");
    let paths = CONFIG.paths.clone();
    log::info!("成功获取路径配置: {:?}", paths);
    paths
}

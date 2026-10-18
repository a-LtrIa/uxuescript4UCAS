/// 提供基于 URL 结构与域名分类判定及脚本匹配功能的核心模块。
/// 基于结构与域名特征进行归类的 URL 类型枚举。
#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub enum Type {
    Course,
    CourseOverview,
    Login,
    MainSpace,
    Other,
    Unknown,
}

/// 判定传入 URL 是否属于超星域名并返回其具体分类类型。
pub fn classify(url: &tauri::Url) -> Type {
    let host = url.host_str().unwrap_or_default();

    if host != "chaoxing.com" && !host.ends_with(".chaoxing.com") {
        return Type::Unknown;
    }

    let sub = host.split('.').next().unwrap_or_default();
    match sub {
        "i" => Type::MainSpace,
        "mooc1" if url.path().starts_with("/mycourse/") => Type::Course,
        "mooc2-ans" => Type::CourseOverview,
        "passport2" if url.path().starts_with("/login") => Type::Login,
        _ => Type::Other,
    }
}

#[cfg(test)]
#[path = "../../tests/unit/core/url.rs"]
mod tests;

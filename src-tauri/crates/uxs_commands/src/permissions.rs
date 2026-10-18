use super::command::{CommandEntry, WebviewScope};
use super::project::ProjectCommands;
use std::fs;
use std::path::Path;

fn permission_names<'a>(commands: impl Iterator<Item = &'a CommandEntry>) -> Vec<String> {
    let mut names: Vec<String> = commands.map(|command| command.name.clone()).collect();
    names.sort();
    names.dedup();
    names
}

fn webview_permission_names(commands: &[CommandEntry], webview: WebviewScope) -> Vec<String> {
    permission_names(
        commands
            .iter()
            .filter(|command| command.webviews.contains(&webview)),
    )
}

fn sync_permission_file(path: &Path, names: Vec<String>) -> Result<(), String> {
    let content = fs::read_to_string(path)
        .map_err(|error| format!("failed to read {}: {error}", path.display()))?;
    let mut json = serde_json::from_str::<serde_json::Value>(&content)
        .map_err(|error| format!("failed to parse {}: {error}", path.display()))?;
    let allow = json
        .pointer_mut("/permission/0/commands/allow")
        .ok_or_else(|| format!("missing permission command allowlist in {}", path.display()))?;
    *allow = serde_json::json!(names);
    let mut updated = serde_json::to_string_pretty(&json)
        .map_err(|error| format!("failed to serialize {}: {error}", path.display()))?;
    updated.push('\n');
    if updated != content {
        fs::write(path, updated)
            .map_err(|error| format!("failed to write {}: {error}", path.display()))?;
    }
    Ok(())
}

pub(super) fn sync(project: &ProjectCommands) -> Result<(), String> {
    sync_permission_file(
        &project.permissions_dir.join("commands-main.json"),
        permission_names(project.commands.iter()),
    )?;
    for webview in WebviewScope::ALL {
        let names = webview_permission_names(&project.commands, webview);
        sync_permission_file(
            &project
                .permissions_dir
                .join(format!("commands-{}.json", webview.name())),
            names,
        )?;
    }
    Ok(())
}

#[cfg(test)]
#[path = "../tests/unit/permissions.rs"]
mod tests;

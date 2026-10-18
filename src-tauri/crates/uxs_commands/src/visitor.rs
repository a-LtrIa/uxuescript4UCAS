use super::command::{parse_webview_args, CommandEntry};
use quote::ToTokens;
use syn::{visit::Visit, ItemFn};

pub(super) struct CommandVisitor {
    pub(super) module_name: String,
    pub(super) commands: Vec<CommandEntry>,
}

impl<'ast> Visit<'ast> for CommandVisitor {
    fn visit_item_fn(&mut self, node: &'ast ItemFn) {
        let has_native_tauri_command = node.attrs.iter().any(|attr| {
            let path = attr.path();
            path.segments.len() == 2
                && path.segments[0].ident == "tauri"
                && path.segments[1].ident == "command"
        });
        if has_native_tauri_command {
            panic!("uxs_commands: bare #[tauri::command] is forbidden; use #[uxs_commands::command(...)]");
        }

        let command_attr = node.attrs.iter().find(|attr| {
            let path = attr.path();
            path.segments.len() == 2
                && path.segments[0].ident == "uxs_commands"
                && path.segments[1].ident == "command"
        });

        if let Some(command_attr) = command_attr {
            let webviews = match &command_attr.meta {
                syn::Meta::Path(_) => Vec::new(),
                syn::Meta::List(list) => list
                    .parse_args_with(syn::punctuated::Punctuated::parse_terminated)
                    .and_then(|args| parse_webview_args(&args))
                    .unwrap_or_else(|error| {
                        panic!("uxs_commands: invalid command attribute: {error}")
                    }),
                syn::Meta::NameValue(_) => {
                    panic!("uxs_commands: command attribute must use a list or no arguments")
                }
            };
            let cfgs = node
                .attrs
                .iter()
                .filter(|attr| attr.path().is_ident("cfg"))
                .map(|attr| attr.to_token_stream().to_string())
                .collect();

            self.commands.push(CommandEntry {
                module_name: self.module_name.clone(),
                name: node.sig.ident.to_string(),
                cfgs,
                webviews,
            });
        }

        syn::visit::visit_item_fn(self, node);
    }
}

#[cfg(test)]
#[path = "../tests/unit/visitor.rs"]
mod tests;

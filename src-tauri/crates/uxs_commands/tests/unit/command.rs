use super::{CommandEntry, WebviewScope, parse_webview_args};
use quote::ToTokens;

fn parse_args(source: &str) -> syn::punctuated::Punctuated<syn::Meta, syn::Token![,]> {
    syn::parse::Parser::parse_str(
        syn::punctuated::Punctuated::<syn::Meta, syn::Token![,]>::parse_terminated,
        source,
    )
    .unwrap()
}

#[test]
fn builds_command_path_from_module_and_name() {
    let command = CommandEntry {
        module_name: "admin::users".to_string(),
        name: "list_users".to_string(),
        cfgs: Vec::new(),
        webviews: Vec::new(),
    };

    assert_eq!(
        command
            .path_from(&syn::parse_quote!(crate))
            .to_token_stream()
            .to_string(),
        "crate :: commands :: admin :: users :: list_users"
    );
}

#[test]
fn restores_cfg_attributes() {
    let command = CommandEntry {
        module_name: "platform".to_string(),
        name: "platform_command".to_string(),
        cfgs: vec!["#[cfg(target_os = \"windows\")]".to_string()],
        webviews: Vec::new(),
    };

    let attributes = command.cfg_attributes();

    assert_eq!(attributes.len(), 1);
    assert!(attributes[0].path().is_ident("cfg"));
}

#[test]
fn parses_and_deduplicates_extra_webview_permissions() {
    let args = parse_args(r#"webview = "chaoxing", webview = "mask", webview = "chaoxing""#);

    assert_eq!(
        parse_webview_args(&args).unwrap(),
        vec![WebviewScope::Chaoxing, WebviewScope::Mask]
    );
}

#[test]
fn rejects_unknown_webview_permission_scopes() {
    let args = parse_args(r#"webview = "other""#);

    assert!(parse_webview_args(&args).is_err());
}

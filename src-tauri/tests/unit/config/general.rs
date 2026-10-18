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

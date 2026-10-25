use std::collections::HashMap;
use std::sync::LazyLock;

use ttf_parser::Face;

use super::typr::{glyph_hash, loca_offsets};
use super::{Question, QuestionPayload};

static FONT_HASH_TABLE: LazyLock<HashMap<String, u32>> = LazyLock::new(|| {
    let raw: HashMap<String, serde_json::Value> =
        serde_json::from_slice(include_bytes!("table.json")).expect("内置字体哈希字典格式无效");
    raw.into_iter()
        .filter_map(|(hash, value)| Some((hash, value.as_u64()? as u32)))
        .collect()
});

fn font_map(font_data: &[u8]) -> HashMap<char, char> {
    let face = match Face::parse(font_data, 0) {
        Ok(face) => face,
        Err(_) => return HashMap::new(),
    };
    let cmap = match face.tables().cmap {
        Some(cmap) => cmap,
        None => return HashMap::new(),
    };
    let offsets = match loca_offsets(font_data) {
        Some(offsets) => offsets,
        None => return HashMap::new(),
    };

    let num_glyphs = face.number_of_glyphs();
    let mut glyph_to_char = HashMap::with_capacity(num_glyphs as usize);
    for subtable in cmap.subtables {
        subtable.codepoints(|codepoint| {
            if let Some(gid) = subtable.glyph_index(codepoint)
                && let Some(ch) = char::from_u32(codepoint)
            {
                glyph_to_char.entry(gid.0).or_insert(ch);
            }
        });
    }

    let mut map = HashMap::new();
    for glyph_id in 0..num_glyphs {
        let Some(&original) = glyph_to_char.get(&glyph_id) else {
            continue;
        };
        let Some(hash) = glyph_hash(font_data, &offsets, glyph_id as usize) else {
            continue;
        };
        let Some(&codepoint) = FONT_HASH_TABLE.get(&hash) else {
            continue;
        };
        if let Some(real) = char::from_u32(codepoint) {
            map.insert(original, real);
        }
    }

    log::debug!("哈希字典匹配到 {} 个字形", map.len());
    map
}

fn map(text: &str, font_map: &HashMap<char, char>) -> String {
    text.chars()
        .map(|c| font_map.get(&c).cloned().unwrap_or(c))
        .collect()
}

pub fn decrypt(payload: QuestionPayload) -> Vec<Question> {
    if let Some(font_data) = payload.font {
        log::info!("检测到加密字体，正在使用哈希字典解密...");
        let font_map = font_map(&font_data);
        payload
            .questions
            .into_iter()
            .map(|q| Question {
                id: map(&q.id, &font_map),
                kind: map(&q.kind, &font_map),
                stem: map(&q.stem, &font_map),
                options: q
                    .options
                    .into_iter()
                    .map(|opt| map(&opt, &font_map))
                    .collect(),
            })
            .collect()
    } else {
        log::info!("未检测到加密字体，跳过解密步骤");
        payload.questions
    }
}

#[cfg(test)]
#[path = "../../../tests/unit/core/quiz/mapper.rs"]
mod tests;

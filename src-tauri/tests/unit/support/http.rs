use std::collections::HashMap;

use crate::config::llm::LLMProtocol;
use serde_json::{Value, json};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpListener;

pub struct Request {
    pub head: String,
    pub headers: HashMap<String, String>,
    pub body: Value,
}

pub async fn serve(status: u16, body: String) -> (String, tokio::task::JoinHandle<Request>) {
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let url = format!("http://{}", listener.local_addr().unwrap());
    let request = tokio::spawn(async move {
        let (mut stream, _) = listener.accept().await.unwrap();
        let mut bytes = Vec::new();
        let mut buffer = [0; 4096];
        let header_end = loop {
            let count = stream.read(&mut buffer).await.unwrap();
            assert_ne!(count, 0, "request ended before headers");
            bytes.extend_from_slice(&buffer[..count]);
            if let Some(end) = bytes.windows(4).position(|part| part == b"\r\n\r\n") {
                break end + 4;
            }
        };
        let headers = String::from_utf8_lossy(&bytes[..header_end]);
        let length: usize = headers
            .lines()
            .find_map(|line| {
                let (name, value) = line.split_once(':')?;
                name.eq_ignore_ascii_case("content-length")
                    .then(|| value.trim().parse().unwrap())
            })
            .unwrap();
        while bytes.len() < header_end + length {
            let count = stream.read(&mut buffer).await.unwrap();
            assert_ne!(count, 0, "request ended before body");
            bytes.extend_from_slice(&buffer[..count]);
        }
        let response = format!(
            "HTTP/1.1 {status} Test\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
            body.len(),
        );
        stream.write_all(response.as_bytes()).await.unwrap();
        let head = String::from_utf8(bytes[..header_end].to_vec()).unwrap();
        let headers = head
            .lines()
            .skip(1)
            .filter_map(|line| {
                let (name, value) = line.split_once(':')?;
                Some((name.to_ascii_lowercase(), value.trim().to_owned()))
            })
            .collect();
        Request {
            head,
            headers,
            body: serde_json::from_slice(&bytes[header_end..]).unwrap(),
        }
    });
    (url, request)
}

pub fn response(protocol: &LLMProtocol, answers: Value) -> String {
    let text = answers.to_string();
    match protocol {
        LLMProtocol::OpenAIChatCompletions => json!({"choices": [{"message": {"content": text}}]}),
        LLMProtocol::OpenAIResponses => {
            json!({"output": [{"type": "message", "content": [{"text": text}]}]})
        }
        LLMProtocol::GoogleGemini => {
            json!({"candidates": [{"content": {"parts": [{"text": text}]}}]})
        }
    }
    .to_string()
}

# 智能答题

智能答题仅在桌面端可用。程序提取章节测验，尝试还原混淆文字，请求模型生成答案，然后自动填入并提交。模型输出不能保证正确。

需要提交前检查时，在 **Course → Review Answers（人工核验）** 开启核验。答案填入后选择 Yes 提交；No 会留出 30 秒检查或修改，再次询问。关闭此选项时自动提交；要停止脚本，使用课程控制栏的刷新或 Home。

## 配置步骤

1. 打开 **Configuration → API**，选择 **Provider** 和 **Model**。
2. 使用自定义服务时，新增 Provider 和服务支持的模型 ID；只有自定义 Provider 支持编辑模型列表。
3. 自定义 **Endpoint** 填完整的 OpenAI Chat Completions 请求 URL，例如 `https://api.example.com/v1/chat/completions`。只填 `/v1` 地址无法使用，UI 不提供协议切换。
4. 输入 **API Key**。免 Key 服务可留空；非空密钥会去除首尾空白，并要求至少 12 个 ASCII 字符。
5. 输入完成后先移开焦点，可点击连接测试按钮发送一道固定题目检查服务，再点击底部 **Save** 保存配置。

内置供应商包含 Bailian（阿里云百炼）、BigModel、DeepSeek、Google、Moonshot、OpenAI、OpenRouter、SiliconFlow（硅基流动）和 Ollama。可用模型以服务端和账户权限为准；连接测试成功仅证明当前请求可用，不代表所有测验都能正确求解。

## 阿里云百炼

选择 **Bailian**，填写北京地域的百炼 API Key，选择模型后测试连接并保存。预设使用 OpenAI 兼容 Chat Completions 接口，默认 `qwen3.8-flash`，关闭思考模式并使用非流式输出。

内置地址使用仍受支持的北京公共域名。官方现推荐业务空间专属域名；需要使用该域名或其他地域时，新增自定义 Provider，填写控制台对应的完整 `/compatible-mode/v1/chat/completions` 地址，确保 API Key 与地域匹配。接口地址见[百炼官方文档](https://help.aliyun.com/zh/model-studio/compatibility-of-openai-with-dashscope)。

## 硅基流动

选择 **SiliconFlow**，填写硅基流动中国站 API Key，选择模型后测试连接并保存。预设使用 `https://api.siliconflow.cn/v1/chat/completions`，默认 DeepSeek V4.1 Flash，采用非流式输出，思考模式沿用各模型默认行为。

模型 ID 需保留厂商前缀与大小写；可用模型见[官方模型目录](https://www.siliconflow.cn/models)。中国站与国际站账号不互通，国际站用户需新增自定义 Provider 并填写对应接口地址。

## 本地 Ollama

内置 Ollama 预设的模型列表为空，当前界面没有拉取模型的入口，也不能编辑内置模型列表。首次配置可按以下方式使用：

1. 启动 Ollama，下载需要使用的模型，并确认服务提供 OpenAI 兼容接口。
2. 新增自定义 Provider，将 Endpoint 设为 `http://localhost:11434/v1/chat/completions`。
3. 新增本机已下载模型的准确名称，API Key 留空，测试连接并保存。

## 数据与失败处理

题目内容会发送到配置的模型服务，请仅填写可信地址。API Key 在界面失焦时遮罩显示，但本地配置仍明文保存，不要分享含密钥的配置文件。

请求失败时检查服务地址、模型名称、密钥、额度和网络。程序会对限流响应自动重试；持续失败请保留脱敏错误信息，不要把连接测试成功当作课程页面兼容性的验证。

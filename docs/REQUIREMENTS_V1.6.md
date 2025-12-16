# AG Nexus - 需求与实现方案 (V1.6)

本文档详细描述了 AG Nexus V1.6 版本的更新需求及相应的技术实现方案。

## 📅 更新概览

本次更新主要集中在 AI 助理的交互体验、多模型支持、多模态能力以及主动式服务（早报 Agent）的增强。

## 📋 需求详情与实现方案

### 1. 助理初始化引导 (Onboarding)

**需求描述**：
当用户首次进入助理页面且未配置 API Key 时，不再仅显示空白或简单的错误提示，而是主动发送一张交互卡片（或消息），引导用户点击进入设置页面进行配置。

**实现方案**：
-   **检测机制**：在 `AssistantPanel` 初始化阶段 (`useEffect`) 检查 `Settings.apiKey`。
-   **UI 交互**：如果 `apiKey` 为空，不渲染常规聊天界面或显示禁用状态，而是渲染一个特殊的 "Setup Guide" 组件或一条系统模拟的 `ChatMessage`。
-   **动作**：消息中包含一个 "去设置" 按钮，点击调用 `setActiveTab('settings')` 跳转。

### 2. 用户称呼与问候 (User Greeting & Profile)

**需求描述**：
-   初次聊天且未设置用户昵称时，AI 应发送问候语并询问用户称呼。
-   用户回答后，AI 调用工具自动记录用户称呼。
-   如果用户跳过（未回答或明确拒绝），则不强制记录。

**实现方案**：
-   **状态存储**：在 `StorageData` 中已存在 `userProfile` (name, gender) 和 `hasAskedUserInfo` 字段（V1.5 代码中已预留，需确认逻辑）。
-   **Agent 逻辑**：
    -   在 `AGNexusAgent.initialize()` 或 `chat()` 中，检查 `userProfile` 是否为空且 `hasAskedUserInfo` 为 false。
    -   如果是，构造一个系统提示 (System Prompt) 注入到对话历史的开头，指示 AI："这是初次见面，请礼貌地问候用户并询问怎么称呼他。如果用户告知了姓名，请调用 `save_user_profile` 工具保存。"
    -   **Tool 定义**：新增 `save_user_profile` 工具，接受 `name` 参数，调用 `Storage.setUserProfile`。
    -   **状态更新**：一旦触发了问询，无论结果如何，标记 `hasAskedUserInfo = true`（或在工具调用成功后标记，视策略而定，建议在初次触发后即标记以免重复打扰，除非用户明确要求）。

### 3. 双模型配置 (Dual Model Settings)

**需求描述**：
设置页面需支持配置两个模型：
1.  **文本模型 (Text Model)**：用于常规对话、逻辑处理（如 qwen-turbo, gpt-4o）。
2.  **视觉模型 (Vision Model)**：用于图片理解（如 qwen-vl-max, gpt-4o）。
用户指名 "qwen3-flash" 作为视觉模型（注：需确认具体 API 模型名称，暂定支持自定义输入或预设列表）。

**实现方案**：
-   **数据结构变更** (`Settings` 接口)：
    -   `model`: string (保持不变，作为文本模型或主模型)
    -   `visionModel`: string (新增，视觉模型，默认值如 `qwen-vl-max`)
-   **UI 变更**：
    -   `SettingsPanel` 中新增 "视觉模型" 下拉选择框/输入框。
-   **Agent 适配**：
    -   `AGNexusAgent` 类需要维护两个 `ChatOpenAI` 实例，或者在需要处理图片时动态实例化视觉模型。
    -   当输入包含图片时，切换使用 `visionModel` 进行推理。

### 4. 图片理解与待办生成 (Image to Todo)

**需求描述**：
-   **输入方式**：支持剪切板粘贴图片、上传按钮上传图片到聊天框。
-   **处理逻辑**：用户发送图片后，调用视觉模型（qwen3-flash/qwen-vl-max）理解图片内容。
-   **业务闭环**：如果图片内容包含任务信息，AI 应能识别并调用 `add_todo` 工具生成待办事项。

**实现方案**：
-   **前端 (AssistantPanel/ChatInput)**：
    -   监听 `paste` 事件获取 `clipboardData` 中的图片。
    -   增加上传按钮 `<input type="file" accept="image/*" />`。
    -   图片转为 Base64 字符串。
    -   `ChatMessage` 类型扩展：支持 `image_url` 字段或多模态内容数组 `content: string | Array<...>`。
-   **Agent 逻辑**：
    -   接收 Base64 图片。
    -   使用 LangChain 的多模态消息格式 (`HumanMessage` with `image_url`)。
    -   路由逻辑：检测到图片 -> 使用 `visionModel` -> 获取文本描述/意图 -> (如果是任务) -> 再次调用工具或直接在 Vision 模型回应中包含工具调用（取决于模型能力，通常建议 Vision 模型先描述，再由文本模型处理工具调用，或者使用支持 Function Calling 的强视觉模型）。
    -   *优化路径*：直接让 Vision 模型支持 Function Calling (Qwen-VL 可能支持有限)，或者采用 "Vision -> Text Description -> Text Agent -> Tool" 的两步法。

### 5. 早报智能体 (Morning Report Agent)

**需求描述**：
-   **功能**：每天早上用户首次打开时，汇总信息生成早报。
-   **数据源**：
    1.  **RSS 订阅**：用户可订阅 RSS 源及对应的"描述词"（关注点）。
    2.  **用户待办**：获取今日待办事项。
-   **输出**：综合生成一份简报。

**实现方案**：
-   **数据结构**：
    -   新增 `rssSources`: `{ url: string, description: string, title: string }[]`。
    -   新增 `lastMorningReportDate`: string (记录上次生成日期，格式 YYYY-MM-DD)。
-   **触发机制**：
    -   `AssistantPanel` 初始化或 `App` 挂载时，检查 `lastMorningReportDate` 是否为今天。
    -   如果不是 -> 触发生成流程 -> 更新日期。
-   **后台处理 (Agent)**：
    -   **Fetch RSS**：需要一个工具或服务去解析 RSS XML (注意跨域问题，可能需要 Background Script 代理或直接在 SidePanel 请求)。
    -   **Summarize**：将 RSS 标题/摘要 + 用户关注描述词 + 今日 Todo 列表，组装成 Prompt。
    -   **Generation**：调用文本模型生成早报内容。
    -   **Display**：作为一条特殊的 `assistant` 消息插入对话流，或者弹出一个专用 Modal。

## 📝 待办事项 (Implementation Todos)

*(此部分将在确认后由 AI 逐步生成)*

---

请确认以上需求理解和实现方案是否准确？确认后我将开始创建 Todo 列表并逐步执行。

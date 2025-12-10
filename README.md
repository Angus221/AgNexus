<div align="center">

# 🚀 AG Nexus

**智能生产力中枢 | Your AI-Powered Productivity Hub**

一个功能强大的 Edge 浏览器扩展，集成导航、指令、提示词、待办、AI助理等功能于一体

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Edge Extension](https://img.shields.io/badge/Edge-Extension-blue.svg)](https://microsoftedge.microsoft.com/addons)
[![Version](https://img.shields.io/badge/version-1.1.0-green.svg)](https://github.com/Angus221/AgNexus)

[English](./docs/README_EN.md) | 简体中文

</div>

---

## ✨ 主要特性

<table>
<tr>
<td width="50%">

### 🧭 智能导航
- 快速访问常用网站
- 自动获取网站图标
- 4列网格优雅排列
- 支持AI语音添加

</td>
<td width="50%">

### 📑 网页收藏
- 收藏优质文章资源
- 智能关键字搜索
- 分页展示清晰明了
- 自动提取页面标题

</td>
</tr>
<tr>
<td width="50%">

### 💻 指令管理
- 一键复制常用命令
- 终端风格图标展示
- 智能搜索过滤
- 代码高亮显示

</td>
<td width="50%">

### 💡 提示词库
- 保存AI提示词模板
- 标签分类管理
- 快速复制使用
- 支持长文本编辑

</td>
</tr>
<tr>
<td width="50%">

### ✅ 智能待办
- 灵活的时间管理
- 三级优先级设置
- 提醒功能可选
- 今日统计一目了然

</td>
<td width="50%">

### 🤖 AI助理
- 支持OpenAI格式接口
- 智能记忆用户偏好
- 自动压缩对话历史
- 工具调用无缝集成

</td>
</tr>
<tr>
<td width="50%">

### 🔮 悬浮球提醒
- 全局悬浮提醒
- 待办倒计时显示
- 5分钟闪烁提醒
- 鼠标悬停查看详情

</td>
<td width="50%">

### 🔐 密钥管理
- 加密存储敏感信息
- PIN码保护
- 支持密码/API密钥
- 一键复制功能

</td>
</tr>
</table>

---

## 🎯 核心亮点

- **🧠 AI记忆系统** - 记住用户偏好，智能压缩对话历史，长期保持上下文
- **🎨 精美UI设计** - 现代化界面，流畅动画，支持暗色模式
- **📦 数据安全** - 本地存储，支持导入导出，可选加密敏感数据
- **⚡ 轻量高效** - 原生JavaScript开发，无依赖，体积小巧
- **🔧 高度可定制** - 支持自定义API，灵活配置各项功能

---

## 🚀 快速开始

### 安装

#### 方式一：从源码安装

```bash
# 1. 克隆仓库
git clone https://github.com/Angus221/AgNexus.git
cd AgNexus

# 2. 打开Edge扩展页面
# 访问 edge://extensions/

# 3. 开启开发者模式
# 点击左侧的"开发人员模式"开关

# 4. 加载扩展
# 点击"加载解压缩的扩展"，选择项目文件夹
```

#### 方式二：从Edge应用商店安装（即将推出）

> 🔜 我们正在准备提交到Microsoft Edge Add-ons

### 配置

#### 1. 配置AI助理

```
1. 点击右上角 "..." 菜单
2. 选择 "设置"
3. 填写API密钥
   - 默认API地址: https://dashscope.aliyuncs.com/compatible-mode/v1
   - 默认模型: qwen-turbo
4. 点击"保存配置"
```

#### 2. 开启悬浮球

```
1. 进入设置页面
2. 勾选"启用悬浮球提醒"
3. 保存设置
4. 刷新网页即可看到悬浮球
```

---

## 📖 功能详解

### 🤖 AI助理进阶功能

#### 记忆系统
- **用户画像**：首次使用时收集称呼和性别，提供个性化服务
- **行为记忆**：智能记录用户习惯和偏好（最多800字）
- **自动压缩**：每50条消息自动压缩，保留重要信息
- **历史管理**：保留最近20条对话，超出自动轮换

#### 工具调用
- **添加导航**：`"把百度加到导航"` → 自动提取域名为标题
- **添加收藏**：`"收藏当前网页"` → 自动提取最后路径为标题
- **添加待办**：`"记个事，明天下午2点开会"` → 智能解析时间和优先级
- **当前网页**：识别"当前网页"等关键词，自动获取当前标签页信息

### 🔐 密钥管理（Vault）

- **4位PIN码**保护
- 支持两种类型：
  - 📧 **密码类型**：账户 + 密码
  - 🔑 **API密钥**：仅密钥
- **加密存储**：XOR + Base64加密
- **一键复制**：密码类型复制 `账户|||密码` 格式

### ✅ 待办清单高级功能

- **灵活时间选择**
  - 今天/明天/本周/其他
  - 开始日期 + 可选提醒时间
  - 默认提醒时间：18:00

- **优先级管理**
  - 🔴 高优先级：紧急且重要
  - 🟡 中优先级：重要
  - 🟢 低优先级：一般任务

- **今日统计**
  - 今日任务总数
  - 已完成数量
  - 高优先级任务数
  - 即将到期任务数

---

## 🛠 技术栈

<table>
<tr>
<td align="center"><b>核心</b></td>
<td>Manifest V3 | Native JavaScript | CSS3</td>
</tr>
<tr>
<td align="center"><b>存储</b></td>
<td>Browser Storage API | 本地持久化</td>
</tr>
<tr>
<td align="center"><b>API</b></td>
<td>Browser Alarms | Browser Notifications | Browser Side Panel</td>
</tr>
<tr>
<td align="center"><b>AI</b></td>
<td>OpenAI Compatible API | 阿里百炼</td>
</tr>
<tr>
<td align="center"><b>架构</b></td>
<td>模块化设计 | 事件驱动 | MVC模式</td>
</tr>
</table>

---

## 📁 项目结构

```
AgNexus/
├── manifest.json              # 扩展配置
├── background.js              # 后台服务Worker
├── icons/                     # 图标资源
│   ├── icon.jpg              # 主图标
│   ├── icon16.png            # 16x16
│   ├── icon48.png            # 48x48
│   └── icon128.png           # 128x128
├── content/                   # 内容脚本
│   └── floatball.js          # 悬浮球功能
└── sidepanel/                 # 侧边栏应用
    ├── index.html            # 主页面
    ├── styles/               # 样式文件
    │   ├── variables.css     # CSS变量
    │   ├── main.css          # 主样式
    │   └── components.css    # 组件样式
    └── js/                   # JavaScript模块
        ├── app.js            # 应用入口
        ├── storage.js        # 存储管理
        ├── tabs.js           # 标签切换
        ├── navigation.js     # 导航模块
        ├── bookmark.js       # 收藏模块
        ├── command.js        # 指令模块
        ├── prompt.js         # 提示词模块
        ├── todo.js           # 待办模块
        ├── assistant.js      # AI助理
        ├── vault.js          # 密钥管理
        ├── settings.js       # 设置模块
        └── toast.js          # 提示组件
```

---

## 👨‍💻 开发指南

### 开发环境

```bash
# 1. 克隆项目
git clone https://github.com/Angus221/AgNexus.git

# 2. 进入目录
cd AgNexus

# 3. 在Edge中加载
# edge://extensions/ → 开发人员模式 → 加载解压缩的扩展
```

### 调试技巧

| 调试目标 | 打开方式 |
|---------|---------|
| **侧边栏** | 右键侧边栏 → 检查 |
| **Background** | 扩展详情 → Service Worker → 检查 |
| **Content Script** | 网页 → F12 → Console |

### 修改后重新加载

1. 访问 `edge://extensions/`
2. 找到 AG Nexus
3. 点击刷新图标 🔄

---

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 如何贡献

1. **Fork** 本仓库
2. **创建**特性分支 (`git checkout -b feature/AmazingFeature`)
3. **提交**更改 (`git commit -m 'Add some AmazingFeature'`)
4. **推送**到分支 (`git push origin feature/AmazingFeature`)
5. **提交** Pull Request

### 代码规范

- 使用2空格缩进
- 变量命名使用驼峰命名法
- 添加必要的注释
- 保持代码简洁易读

### 报告问题

如果您发现了bug或有功能建议，请[提交Issue](https://github.com/Angus221/AgNexus/issues)

---

## 📝 更新日志

### v1.1.0 (2025-12-10)

#### ✨ 新功能
- 🔐 新增密钥管理（Vault）功能
- 🧠 AI记忆系统：用户画像、行为记忆、自动压缩
- 🔄 悬浮球点击切换侧边栏显示/隐藏
- 📦 数据导出支持选择是否包含敏感信息

#### ♻️ 重构
- 重新设计待办功能：简化时间选择，优化数据结构
- AI助理仅在首次使用时询问用户信息，支持跳过
- 历史对话限制为20条，纯工具操作不计入历史

#### 🎨 UI优化
- 指令卡片：添加终端图标，只显示代码内容
- 提示词卡片：移除内容预览，减小卡片间距
- 收藏卡片：单行显示，移除域名和描述
- 悬浮球大小调整为36x36

#### 🐛 Bug修复
- 修复第二次收藏失败的问题
- 修复空气泡问题
- 优化悬浮球初始化逻辑

### v1.0.0 (2025-12-09)
- 🎉 初始版本发布

[查看完整更新日志](./docs/CHANGELOG.md)

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 🙏 致谢

- 感谢 [阿里百炼](https://dashscope.aliyun.com/) 提供的AI服务
- 感谢所有贡献者的付出
- 图标来源于项目自有设计

---

## 📬 联系方式

- **项目主页**: [https://github.com/Angus221/AgNexus](https://github.com/Angus221/AgNexus)
- **问题反馈**: [GitHub Issues](https://github.com/Angus221/AgNexus/issues)
- **作者**: Angus Wang

---

<div align="center">

**如果这个项目对你有帮助，请给个 ⭐️ Star 支持一下！**

Made with ❤️ by AG Nexus Team

</div>

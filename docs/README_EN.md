<div align="center">

# 🚀 AG Nexus

**Your AI-Powered Productivity Hub**

A powerful Edge browser extension integrating navigation, commands, prompts, todos, AI assistant, and more

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Edge Extension](https://img.shields.io/badge/Edge-Extension-blue.svg)](https://microsoftedge.microsoft.com/addons)
[![Version](https://img.shields.io/badge/version-1.1.0-green.svg)](https://github.com/Angus221/AgNexus)

English | [简体中文](../README.md)

</div>

---

## ✨ Key Features

<table>
<tr>
<td width="50%">

### 🧭 Smart Navigation
- Quick access to frequently used websites
- Automatic favicon fetching
- Elegant 4-column grid layout
- AI voice-powered addition

</td>
<td width="50%">

### 📑 Web Bookmarks
- Bookmark quality articles and resources
- Smart keyword search
- Clear paginated display
- Auto-extract page titles

</td>
</tr>
<tr>
<td width="50%">

### 💻 Command Management
- One-click copy for common commands
- Terminal-style icon display
- Smart search filtering
- Code syntax highlighting

</td>
<td width="50%">

### 💡 Prompt Library
- Save AI prompt templates
- Tag-based categorization
- Quick copy to use
- Support for long text editing

</td>
</tr>
<tr>
<td width="50%">

### ✅ Smart Todos
- Flexible time management
- Three-level priority settings
- Optional reminder function
- Today's stats at a glance

</td>
<td width="50%">

### 🤖 AI Assistant
- OpenAI-compatible API support
- Intelligent user preference memory
- Auto-compress conversation history
- Seamless tool integration

</td>
</tr>
<tr>
<td width="50%">

### 🔮 Float Ball Reminder
- Global floating reminder
- Todo countdown display
- 5-minute flash reminder
- Hover to view details

</td>
<td width="50%">

### 🔐 Vault Management
- Encrypted storage of sensitive info
- PIN code protection
- Support for passwords/API keys
- One-click copy function

</td>
</tr>
</table>

---

## 🎯 Core Highlights

- **🧠 AI Memory System** - Remember user preferences, intelligently compress conversation history, maintain long-term context
- **🎨 Beautiful UI Design** - Modern interface, smooth animations, dark mode support
- **📦 Data Security** - Local storage, import/export support, optional sensitive data encryption
- **⚡ Lightweight & Efficient** - Native JavaScript development, no dependencies, compact size
- **🔧 Highly Customizable** - Support for custom APIs, flexible configuration for all features

---

## 🚀 Quick Start

### Installation

#### Method 1: Install from Source

```bash
# 1. Clone the repository
git clone https://github.com/Angus221/AgNexus.git
cd AgNexus

# 2. Open Edge extensions page
# Visit edge://extensions/

# 3. Enable Developer Mode
# Toggle the "Developer mode" switch on the left

# 4. Load the extension
# Click "Load unpacked" and select the project folder
```

#### Method 2: Install from Edge Add-ons Store (Coming Soon)

> 🔜 We are preparing to submit to Microsoft Edge Add-ons

### Configuration

#### 1. Configure AI Assistant

```
1. Click the "..." menu in the top right corner
2. Select "Settings"
3. Fill in your API key
   - Default API URL: https://dashscope.aliyuncs.com/compatible-mode/v1
   - Default model: qwen-turbo
4. Click "Save Configuration"
```

#### 2. Enable Float Ball

```
1. Go to Settings page
2. Check "Enable float ball reminder"
3. Save settings
4. Refresh the webpage to see the float ball
```

---

## 📖 Feature Details

### 🤖 AI Assistant Advanced Features

#### Memory System
- **User Profile**: Collects name and gender on first use for personalized service
- **Behavior Memory**: Intelligently records user habits and preferences (max 800 chars)
- **Auto-Compression**: Automatically compress every 50 messages, retaining important info
- **History Management**: Keep the latest 20 conversations, auto-rotate when exceeded

#### Tool Calling
- **Add Navigation**: `"Add Baidu to navigation"` → Auto-extract domain as title
- **Add Bookmark**: `"Bookmark current page"` → Auto-extract last path as title
- **Add Todo**: `"Remember this, meeting tomorrow at 2 PM"` → Smart time and priority parsing
- **Current Page**: Recognizes keywords like "current page" and auto-fetches active tab info

### 🔐 Vault Management

- **4-digit PIN** protection
- Supports two types:
  - 📧 **Password Type**: Account + Password
  - 🔑 **API Key**: Key only
- **Encrypted Storage**: XOR + Base64 encryption
- **One-click Copy**: Password type copies in `account|||password` format

### ✅ Advanced Todo Features

- **Flexible Time Selection**
  - Today/Tomorrow/This Week/Other
  - Start date + optional reminder time
  - Default reminder time: 18:00

- **Priority Management**
  - 🔴 High Priority: Urgent and important
  - 🟡 Medium Priority: Important
  - 🟢 Low Priority: General tasks

- **Today's Stats**
  - Total tasks today
  - Completed count
  - High priority task count
  - Upcoming due tasks count

---

## 🛠 Tech Stack

<table>
<tr>
<td align="center"><b>Core</b></td>
<td>Manifest V3 | Native JavaScript | CSS3</td>
</tr>
<tr>
<td align="center"><b>Storage</b></td>
<td>Browser Storage API | Local Persistence</td>
</tr>
<tr>
<td align="center"><b>APIs</b></td>
<td>Browser Alarms | Browser Notifications | Browser Side Panel</td>
</tr>
<tr>
<td align="center"><b>AI</b></td>
<td>OpenAI Compatible API | Alibaba Bailian</td>
</tr>
<tr>
<td align="center"><b>Architecture</b></td>
<td>Modular Design | Event-Driven | MVC Pattern</td>
</tr>
</table>

---

## 📁 Project Structure

```
AgNexus/
├── manifest.json              # Extension config
├── background.js              # Background service worker
├── icons/                     # Icon resources
│   ├── icon.jpg              # Main icon
│   ├── icon16.png            # 16x16
│   ├── icon48.png            # 48x48
│   └── icon128.png           # 128x128
├── content/                   # Content scripts
│   └── floatball.js          # Float ball functionality
└── sidepanel/                 # Sidebar application
    ├── index.html            # Main page
    ├── styles/               # Style files
    │   ├── variables.css     # CSS variables
    │   ├── main.css          # Main styles
    │   └── components.css    # Component styles
    └── js/                   # JavaScript modules
        ├── app.js            # Application entry
        ├── storage.js        # Storage management
        ├── tabs.js           # Tab switching
        ├── navigation.js     # Navigation module
        ├── bookmark.js       # Bookmark module
        ├── command.js        # Command module
        ├── prompt.js         # Prompt module
        ├── todo.js           # Todo module
        ├── assistant.js      # AI assistant
        ├── vault.js          # Vault management
        ├── settings.js       # Settings module
        └── toast.js          # Toast component
```

---

## 👨‍💻 Development Guide

### Development Environment

```bash
# 1. Clone the project
git clone https://github.com/Angus221/AgNexus.git

# 2. Enter directory
cd AgNexus

# 3. Load in Edge
# edge://extensions/ → Developer mode → Load unpacked
```

### Debugging Tips

| Debug Target | How to Open |
|-------------|-------------|
| **Sidepanel** | Right-click sidepanel → Inspect |
| **Background** | Extension details → Service Worker → Inspect |
| **Content Script** | Webpage → F12 → Console |

### Reload After Changes

1. Visit `edge://extensions/`
2. Find AG Nexus
3. Click the refresh icon 🔄

---

## 🤝 Contributing

We welcome all forms of contribution!

### How to Contribute

1. **Fork** this repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Submit** a Pull Request

### Code Standards

- Use 2-space indentation
- Use camelCase for variable naming
- Add necessary comments
- Keep code clean and readable

### Report Issues

If you find a bug or have feature suggestions, please [submit an Issue](https://github.com/Angus221/AgNexus/issues)

---

## 📝 Changelog

### v1.1.0 (2025-12-10)

#### ✨ New Features
- 🔐 Added Vault management feature
- 🧠 AI memory system: user profile, behavior memory, auto-compression
- 🔄 Float ball click toggles sidebar show/hide
- 📦 Data export supports option to include sensitive info

#### ♻️ Refactoring
- Redesigned todo feature: simplified time selection, optimized data structure
- AI assistant only asks for user info on first use, supports skip
- Chat history limited to 20 messages, pure tool operations not counted

#### 🎨 UI Optimization
- Command cards: added terminal icon, only show code content
- Prompt cards: removed content preview, reduced card spacing
- Bookmark cards: single-line display, removed domain and description
- Float ball size adjusted to 36x36

#### 🐛 Bug Fixes
- Fixed second bookmark attempt failure issue
- Fixed empty bubble issue
- Optimized float ball initialization logic

### v1.0.0 (2025-12-09)
- 🎉 Initial release

[View Full Changelog](./CHANGELOG.md)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details

---

## 🙏 Acknowledgments

- Thanks to [Alibaba Bailian](https://dashscope.aliyun.com/) for providing AI services
- Thanks to all contributors
- Icons are from the project's own design

---

## 📬 Contact

- **Project Home**: [https://github.com/Angus221/AgNexus](https://github.com/Angus221/AgNexus)
- **Issue Feedback**: [GitHub Issues](https://github.com/Angus221/AgNexus/issues)
- **Author**: Angus Wang

---

<div align="center">

**If this project helps you, please give it a ⭐️ Star to support it!**

Made with ❤️ by AG Nexus Team

</div>

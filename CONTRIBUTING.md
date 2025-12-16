# 贡献指南 (Contributing Guide)

感谢你对 **AG Nexus** 感兴趣！我们非常欢迎社区成员参与贡献，无论是修复 Bug、改进文档还是添加新功能。

## 🤝 如何参与

### 🐛 提交 Bug

如果你发现了 Bug，请在 GitHub Issues 中提交一个新的 Issue。提交时请包含以下信息：

1.  **Bug 描述**：清晰描述发生了什么。
2.  **复现步骤**：详细的步骤来重现该问题。
3.  **预期行为**：你期望发生什么。
4.  **环境信息**：浏览器版本、操作系统、扩展版本等。
5.  **截图/录屏**：如果有助于理解问题，请提供。

### 💡 建议新功能

如果你有新功能的想法，也请提交 Issue，并选择 "Feature Request" 模板（如果有）。请详细描述你的想法以及它解决了什么问题。

### 🛠️ 代码贡献流程

1.  **Fork 本仓库**：点击右上角的 "Fork" 按钮。
2.  **克隆代码**：将 Fork 后的仓库克隆到本地。
    ```bash
    git clone https://github.com/你的用户名/AgNexus.git
    cd ag.nexus
    ```
3.  **创建分支**：为你的修改创建一个新的分支。
    ```bash
    git checkout -b feature/my-new-feature
    # 或者
    git checkout -b fix/bug-fix-description
    ```
4.  **安装依赖**：
    ```bash
    pnpm install
    ```
5.  **进行开发**：请确保代码风格与项目保持一致。
6.  **代码检查**：提交前请运行 Lint 检查。
    ```bash
    npm run lint
    ```
7.  **提交代码**：
    ```bash
    git add .
    git commit -m "feat: 添加了某项很酷的功能"
    ```
    *建议使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范提交信息。*
8.  **推送到远程**：
    ```bash
    git push origin feature/my-new-feature
    ```
9.  **提交 Pull Request**：在 GitHub 上提交 PR 到 `main` 分支。

## 📐 代码规范

-   本项目使用 **TypeScript**，请尽量定义清晰的类型。
-   样式使用 **Tailwind CSS**，请遵循原子化 CSS 的最佳实践。
-   代码格式化使用 **Prettier**，提交前请确保格式正确。
-   Lint 工具使用 **ESLint**。

## 🏗️ 开发环境

请参考 `README.md` 中的 [快速开始](README.md#快速开始) 部分搭建开发环境。

## 📄 许可证

参与贡献即表示你同意你的代码遵循本项目的 [MIT 许可证](LICENSE)。

---

再次感谢你的贡献！🚀

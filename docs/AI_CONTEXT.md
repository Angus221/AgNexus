# AG Nexus - AI Context & Developer Guide

This document provides technical context and architectural details for AI assistants (and human developers) working on the AG Nexus codebase.

## 🧠 Project Overview

**AG Nexus** is a Chrome/Edge Extension acting as a productivity hub in the browser side panel.
It integrates multiple isolated features ("Apps") into a single unified interface.

## 🏗️ Architecture

### Core Components
1.  **Side Panel (`src/sidepanel`)**: The main UI entry point.
    -   **Entry**: `index.html` -> `main.tsx` -> `App.tsx`
    -   **Routing**: Custom tab-based routing (not React Router) managed by `TabContext`.
    -   **UI Library**: HeroUI (NextUI) + Tailwind CSS.

2.  **Background (`src/background.js`)**: Service Worker.
    -   Handles extension lifecycle, context menus, and side panel behavior.
    -   *Note: Currently minimal logic, mostly for opening the panel.*

3.  **Content Scripts (`src/content`)**:
    -   `floatball.js`: Injected into web pages to show a floating action button/reminder.

### State Management
-   **React Context**:
    -   `TabContext`: Manages the active feature panel (`activeTab`).
    -   `ThemeContext`: Manages Dark/Light mode.
-   **Chrome Storage**:
    -   Used for persisting user data (Todos, Navigations, Vault, Prompts).
    -   `src/sidepanel/services/storage.ts`: Typed wrapper around `chrome.storage.local`.

### Feature Modules (`src/sidepanel/features/`)

Each feature is self-contained in its own directory:

-   **`assistant/`**: AI Chat interface using LangChain.
    -   Uses `src/sidepanel/services/agent/` for LLM logic.
-   **`navigation/`**: Grid of shortcuts.
    -   Uses `src/sidepanel/hooks/useNavigation.ts`.
-   **`todo/`**: Todo list with drag-and-drop (dnd-kit or similar) and priority logic.
-   **`vault/`**: Encrypted storage.
    -   *Security Note*: Encryption logic needs to be verified in `services/`.
-   **`command/`**: Code snippet manager.
-   **`prompt/`**: Prompt template manager.

## 🛠️ Tech Stack Details

-   **Framework**: React 18 + Vite.
-   **Styling**: Tailwind CSS v4 (using `@tailwindcss/vite` plugin).
-   **UI Components**: `@heroui/react`.
-   **Icons**: `lucide-react`.
-   **AI Integration**: `langchain` + `@langchain/openai`.
-   **Build Target**: Chrome Extension Manifest V3.

## 📝 Coding Conventions

-   **Components**: Functional components with TypeScript.
-   **Styling**: Use Tailwind utility classes. Avoid custom CSS files unless necessary (`globals.css` is for base styles).
-   **Imports**: Use relative imports or configured aliases (check `tsconfig.json`).
-   **Async/Await**: Prefer over `.then()`.
-   **Error Handling**: Use `react-hot-toast` for user notifications.

## 🔄 Common Workflows

### Adding a New Feature Panel
1.  Create `src/sidepanel/features/new-feature/NewFeaturePanel.tsx`.
2.  Add tab ID to `src/sidepanel/types/index.ts` (if enum exists) or `TabContext`.
3.  Register icon and component in `App.tsx` or main layout (Sidebar navigation).

### Modifying AI Logic
-   Edit `src/sidepanel/services/agent/agent.ts` to change model parameters or system prompts.
-   Edit `src/sidepanel/services/agent/tools.ts` to add new tools for the agent.

## ⚠️ Important Notes

-   **Chrome APIs**: Always check for `chrome` runtime availability before calling extension APIs to allow running in standard web mode (dev server) if mocked.
-   **Storage Limit**: `chrome.storage.sync` has strict limits; prefer `local` for large data.
-   **Security**: Never commit API keys. The user must enter their own keys in Settings.


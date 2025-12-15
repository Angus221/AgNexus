# AG.NEXUS 设计文档

> **智能生产力中枢** - 全功能 Edge 浏览器扩展设计规范
> 版本：V1.5-HeroUI
> 更新日期：2025-12-15

---

## 📋 目录

- [1. 项目概述](#1-项目概述)
- [2. 技术栈](#2-技术栈)
- [3. 整体布局设计](#3-整体布局设计)
- [4. 功能模块设计](#4-功能模块设计)
- [5. UI 组件规范](#5-ui-组件规范)
- [6. 交互设计](#6-交互设计)
- [7. 主题与样式](#7-主题与样式)

---

## 1. 项目概述

### 1.1 产品定位
AG.NEXUS 是一个集成多功能的浏览器侧边栏扩展，旨在成为用户的智能生产力中枢。

### 1.2 核心价值
- 🎯 **一站式管理**：导航、收藏、指令、提示词、待办统一管理
- 🤖 **AI 增强**：内置智能助理，支持 OpenAI 格式 API
- 🔐 **安全可靠**：密钥加密存储，PIN 码保护
- 🎨 **现代设计**：基于 HeroUI，毛玻璃效果，优雅简洁

### 1.3 目标用户
- 开发者、设计师、产品经理
- 需要高效管理工作流的知识工作者
- AI 工具重度使用者

---

## 2. 技术栈

### 2.1 前端框架
- **React 19.2.3** - UI 框架
- **TypeScript 5.9.3** - 类型安全
- **Vite 7.2.7** - 构建工具

### 2.2 UI 组件库
- **HeroUI 2.8.6** - 主 UI 组件库（基于 NextUI）
- **Lucide React 0.561.0** - 图标库
- **Tailwind CSS 3.4.19** - 样式工具
- **Framer Motion 12.23.26** - 动画库

### 2.3 AI & 工具链
- **LangChain** - AI 对话引擎
- **React Markdown** - Markdown 渲染
- **Highlight.js** - 代码高亮
- **React Hook Form** - 表单管理
- **Zod** - 数据验证

---

## 3. 整体布局设计

### 3.1 布局结构

```
┌─────────────────────────────────┐
│  顶部导航栏 (App Bar)           │  ← 64px 高度
│  [助理][导航][指令][提示][待办] [更多▼] │
├─────────────────────────────────┤
│                                 │
│                                 │
│        主内容区                 │  ← flex-1
│      (功能面板切换)             │
│                                 │
│                                 │
└─────────────────────────────────┘
```

### 3.2 顶部导航栏 (App Bar)

**设计规范：**

| 属性 | 值 | 说明 |
|------|-----|------|
| 高度 | `h-16` (64px) | 紧凑但舒适的点击区域 |
| 背景 | `bg-background/70 backdrop-blur-md` | 毛玻璃效果 |
| 边框 | `border-b border-divider/50` | 轻量分割线 |
| 布局 | `flex justify-between` | 两端对齐 |

**左侧核心功能区（5个按钮）：**

```tsx
<Button
  variant="light"
  radius="sm"
  className="h-14 w-14 flex flex-col gap-0.5"
>
  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
  <span className="text-[10px]">{label}</span>
</Button>
```

| 按钮 | 图标 | 文字 | 功能 |
|------|------|------|------|
| 1 | `Bot` | 助理 | AI 对话助手 |
| 2 | `Compass` | 导航 | 网站快捷导航 |
| 3 | `Terminal` | 指令 | 命令管理 |
| 4 | `Lightbulb` | 提示 | Prompt 模板 |
| 5 | `ListTodo` | 待办 | 任务管理 |

**按钮状态：**
- 默认：`text-default-500 hover:bg-default-100`
- 激活：`text-primary bg-primary/10 font-medium`

**右侧辅助区（更多按钮）：**

```tsx
<Dropdown placement="bottom-end">
  <DropdownTrigger>
    <Button isIconOnly variant="light" className="h-14 w-10">
      <EllipsisVertical size={20} />
    </Button>
  </DropdownTrigger>
  <DropdownMenu>
    <DropdownItem key="bookmark" startContent={<Bookmark />}>收藏夹</DropdownItem>
    <DropdownItem key="vault" startContent={<Vault />}>保险库</DropdownItem>
    <DropdownItem key="settings" startContent={<Settings />}>全局设置</DropdownItem>
  </DropdownMenu>
</Dropdown>
```

### 3.3 主内容区

- **容器**：`flex-1 overflow-hidden`
- **背景**：`bg-background`
- **面板切换**：根据 `activeTab` 渲染对应功能面板

---

## 4. 功能模块设计

### 4.1 AI 助理 (Assistant)

**功能定位：**
智能对话助手，支持工具调用、记忆管理、历史压缩。

**布局结构：**

```
┌─────────────────────────────────┐
│  ScrollShadow (聊天区域)        │
│  ┌───────────────────────────┐  │
│  │  [AI 头像]  [消息气泡]    │  │
│  │  [用户头像] [消息气泡]    │  │
│  │  ...                      │  │
│  └───────────────────────────┘  │
├─────────────────────────────────┤
│  底部输入区 (固定)              │
│  [🗑️] [━━━━━━━━━━━ 📤]        │
└─────────────────────────────────┘
```

**消息气泡设计：**

| 角色 | 背景色 | 文字色 | 圆角特殊处理 |
|------|--------|--------|--------------|
| User | `bg-primary` | `text-primary-foreground` | `rounded-tr-none` (右上角尖) |
| AI | `bg-content1` | `text-foreground` | `rounded-tl-none` (左上角尖) |

**消息布局：**
```tsx
<div className="flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}">
  <Avatar icon={<User/Sparkles>} size="sm" />
  <Card shadow="sm" className="max-w-[85%]">
    <CardBody className="px-3.5 py-2.5">
      {isUser ? <Text /> : <MarkdownRenderer />}
    </CardBody>
  </Card>
</div>
```

**底部输入区：**

```tsx
<Input
  radius="full"           // 全圆角
  size="lg"               // 大尺寸
  variant="bordered"      // 边框样式
  placeholder="输入消息..."
  endContent={
    <Button
      isIconOnly
      color="primary"
      radius="full"
      variant={input.trim() ? "solid" : "flat"}  // 动态变体
    >
      <Send size={16} />
    </Button>
  }
/>
```

**特性：**
- ✅ Markdown 渲染（支持 GFM、代码高亮）
- ✅ 流式输出动画
- ✅ 历史记录自动压缩
- ✅ 工具调用（添加导航、收藏、待办等）

---

### 4.2 智能导航 (Navigation)

**功能定位：**
快速访问常用网站，支持 AI 语音添加。

**布局：**
- **网格布局**：`grid grid-cols-4 gap-3`
- **卡片设计**：`Card` + `CardBody`
- **图标展示**：自动获取 favicon
- **操作按钮**：编辑、删除

**卡片结构：**
```tsx
<Card shadow="sm" isPressable onPress={handleNavigate}>
  <CardBody className="flex flex-col items-center gap-2 p-4">
    <Avatar src={item.icon} size="lg" />
    <p className="text-sm font-medium truncate">{item.name}</p>
    <p className="text-xs text-default-400 truncate">{item.url}</p>
  </CardBody>
</Card>
```

**添加弹窗：**
```tsx
<Modal>
  <ModalHeader>添加导航</ModalHeader>
  <ModalBody>
    <Input label="名称" />
    <Input label="网址" />
    <Input label="图标URL (可选)" />
  </ModalBody>
  <ModalFooter>
    <Button variant="light">取消</Button>
    <Button color="primary">添加</Button>
  </ModalFooter>
</Modal>
```

---

### 4.3 网页收藏 (Bookmark)

**功能定位：**
收藏优质文章，智能搜索。

**布局：**
- **列表布局**：`flex flex-col gap-2`
- **搜索框**：顶部固定
- **分页器**：底部居中

**收藏项设计：**
```tsx
<Card shadow="sm">
  <CardBody className="flex flex-row justify-between">
    <div className="flex-1">
      <p className="font-medium">{item.title}</p>
      <p className="text-xs text-default-400 truncate">{item.url}</p>
      <p className="text-xs text-default-300 mt-1">{item.time}</p>
    </div>
    <ButtonGroup size="sm">
      <Button isIconOnly><ExternalLink /></Button>
      <Button isIconOnly color="danger"><Trash /></Button>
    </ButtonGroup>
  </CardBody>
</Card>
```

**特性：**
- 🔍 实时搜索过滤
- 📄 分页展示（10条/页）
- 🔗 一键打开链接
- 🗑️ 删除确认提示

---

### 4.4 指令管理 (Command)

**功能定位：**
管理常用命令，一键复制。

**布局：**
- **网格布局**：`grid grid-cols-2 gap-3`
- **终端风格**：深色背景 + 等宽字体

**指令卡片：**
```tsx
<Card shadow="sm" className="bg-default-900">
  <CardBody className="p-4">
    <div className="flex items-center gap-2 mb-2">
      <Terminal size={16} className="text-green-400" />
      <p className="text-sm font-medium text-white">{item.name}</p>
    </div>
    <code className="text-xs text-green-300 font-mono">
      {item.command}
    </code>
    <Button
      size="sm"
      color="success"
      variant="flat"
      onPress={handleCopy}
      className="mt-2"
    >
      复制
    </Button>
  </CardBody>
</Card>
```

**特性：**
- 📋 一键复制到剪贴板
- 🎨 代码高亮显示
- 🔍 智能搜索过滤

---

### 4.5 提示词库 (Prompt)

**功能定位：**
保存 AI 提示词模板，标签分类。

**布局：**
- **瀑布流/列表**：`flex flex-col gap-3`
- **标签筛选**：顶部 Chip 组

**提示词卡片：**
```tsx
<Card shadow="sm">
  <CardHeader className="flex justify-between">
    <p className="font-medium">{item.title}</p>
    <Chip size="sm" color="primary">{item.tag}</Chip>
  </CardHeader>
  <CardBody>
    <p className="text-sm text-default-600 line-clamp-3">
      {item.content}
    </p>
  </CardBody>
  <CardFooter className="gap-2">
    <Button size="sm" variant="flat">复制</Button>
    <Button size="sm" variant="light">编辑</Button>
  </CardFooter>
</Card>
```

**特性：**
- 🏷️ 标签分类管理
- 📝 长文本折叠显示
- 📋 快速复制使用

---

### 4.6 智能待办 (Todo)

**功能定位：**
任务管理，优先级、时间、提醒。

**布局：**
- **统计卡片**：顶部显示今日任务概览
- **任务列表**：按优先级分组
- **添加按钮**：右下角浮动

**统计卡片：**
```tsx
<Card className="mb-4">
  <CardBody className="flex flex-row justify-around">
    <div className="text-center">
      <p className="text-2xl font-bold text-primary">{total}</p>
      <p className="text-xs text-default-400">总计</p>
    </div>
    <div className="text-center">
      <p className="text-2xl font-bold text-success">{completed}</p>
      <p className="text-xs text-default-400">已完成</p>
    </div>
    <div className="text-center">
      <p className="text-2xl font-bold text-warning">{pending}</p>
      <p className="text-xs text-default-400">待完成</p>
    </div>
  </CardBody>
</Card>
```

**任务项设计：**
```tsx
<Card shadow="sm" className={priorityColor}>
  <CardBody className="flex flex-row items-start gap-3">
    <Checkbox isSelected={item.completed} onValueChange={handleToggle} />
    <div className="flex-1">
      <p className={item.completed ? "line-through text-default-400" : ""}>
        {item.title}
      </p>
      {item.time && (
        <p className="text-xs text-default-400 mt-1">
          ⏰ {item.time}
        </p>
      )}
    </div>
    <Chip size="sm" color={priorityColor}>{item.priority}</Chip>
  </CardBody>
</Card>
```

**优先级配色：**
- 🔴 高优先级：`color="danger"`
- 🟡 中优先级：`color="warning"`
- 🟢 低优先级：`color="success"`

---

### 4.7 保险库 (Vault)

**功能定位：**
加密存储敏感信息（密码、API Key）。

**安全机制：**
- 🔐 PIN 码保护
- 🔒 AES-256 加密存储
- 👁️ 密码明文/隐藏切换

**解锁界面：**
```tsx
<div className="flex flex-col items-center justify-center h-full">
  <Lock size={64} className="text-primary mb-4" />
  <p className="text-lg font-medium mb-4">输入 PIN 码</p>
  <Input
    type="password"
    maxLength={6}
    className="w-48"
  />
  <Button color="primary" className="mt-4">解锁</Button>
</div>
```

**密钥项：**
```tsx
<Card shadow="sm">
  <CardBody>
    <p className="font-medium">{item.name}</p>
    <div className="flex items-center gap-2 mt-2">
      <Input
        type={isVisible ? "text" : "password"}
        value={item.value}
        isReadOnly
      />
      <Button isIconOnly size="sm" onPress={toggleVisibility}>
        {isVisible ? <EyeOff /> : <Eye />}
      </Button>
      <Button isIconOnly size="sm" onPress={handleCopy}>
        <Copy />
      </Button>
    </div>
  </CardBody>
</Card>
```

---

### 4.8 全局设置 (Settings)

**功能定位：**
配置 API Key、主题、通知等。

**布局：**
- **分组设置**：`Accordion` 折叠面板
- **开关控件**：`Switch`
- **表单输入**：`Input`

**设置项：**
```tsx
<Accordion>
  <AccordionItem title="AI 配置">
    <Input label="API Base URL" />
    <Input label="API Key" type="password" />
    <Select label="默认模型">
      <SelectItem key="gpt-4">GPT-4</SelectItem>
      <SelectItem key="gpt-3.5">GPT-3.5</SelectItem>
    </Select>
  </AccordionItem>

  <AccordionItem title="界面设置">
    <Switch>深色模式</Switch>
    <Switch>紧凑布局</Switch>
  </AccordionItem>

  <AccordionItem title="通知提醒">
    <Switch>待办提醒</Switch>
    <Input label="提前提醒时间（分钟）" type="number" />
  </AccordionItem>
</Accordion>
```

---

## 5. UI 组件规范

### 5.1 颜色系统

| 用途 | 类名 | 色值（Light） | 色值（Dark） |
|------|------|---------------|--------------|
| 主色 | `primary` | `#6366F1` (Indigo) | `#6366F1` |
| 背景 | `background` | `#F9FAFB` | `#111827` |
| 前景 | `foreground` | `#1E293B` | `#F3F4F6` |
| 分割线 | `divider` | `#E2E8F0` | `#4B5563` |
| 成功 | `success` | `#10B981` | `#34D399` |
| 警告 | `warning` | `#F59E0B` | `#FBBF24` |
| 危险 | `danger` | `#EF4444` | `#F87171` |

### 5.2 字体规范

| 用途 | 类名 | 字号 | 粗细 |
|------|------|------|------|
| 大标题 | `text-2xl` | 24px | 700 |
| 标题 | `text-lg` | 18px | 600 |
| 正文 | `text-sm` | 14px | 400 |
| 辅助文字 | `text-xs` | 12px | 400 |
| 超小文字 | `text-[10px]` | 10px | 400 |
| 代码 | `font-mono` | - | 400 |

### 5.3 圆角规范

| 大小 | 类名 | 数值 |
|------|------|------|
| 小圆角 | `radius="sm"` | 8px |
| 中圆角 | `radius="md"` | 12px |
| 大圆角 | `radius="lg"` | 16px |
| 全圆角 | `radius="full"` | 9999px |

### 5.4 阴影规范

| 层级 | 类名 | 效果 |
|------|------|------|
| 无阴影 | `shadow="none"` | 极简风格 |
| 小阴影 | `shadow="sm"` | 轻微浮起 |
| 中阴影 | `shadow="md"` | 明显层次 |
| 大阴影 | `shadow="lg"` | 强调重点 |

### 5.5 间距规范

| 用途 | 类名 | 数值 |
|------|------|------|
| 组件内边距 | `p-4` | 16px |
| 卡片间距 | `gap-3` | 12px |
| 列表项间距 | `gap-2` | 8px |
| 小元素间距 | `gap-1` | 4px |

---

## 6. 交互设计

### 6.1 按钮交互

**状态变化：**
```tsx
// 默认状态
<Button variant="light" className="hover:bg-default-100">

// 激活状态
<Button variant="light" className="bg-primary/10 text-primary">

// 禁用状态
<Button isDisabled>

// 加载状态
<Button isLoading>
```

**点击反馈：**
- 轻微缩放动画：`active:scale-95`
- 颜色变化：`transition-colors`
- Ripple 效果：HeroUI 内置

### 6.2 表单交互

**输入框聚焦：**
```tsx
<Input
  variant="faded"
  classNames={{
    inputWrapper: "focus-within:border-primary"
  }}
/>
```

**验证反馈：**
```tsx
<Input
  isInvalid={hasError}
  errorMessage={errorText}
  color={hasError ? "danger" : "default"}
/>
```

### 6.3 列表交互

**悬停效果：**
```tsx
<Card isPressable className="hover:scale-[1.02] transition-transform">
```

**加载状态：**
```tsx
{isLoading && <Spinner size="lg" className="mx-auto" />}
```

### 6.4 弹窗交互

**打开/关闭动画：**
```tsx
<Modal
  isOpen={isOpen}
  onOpenChange={onOpenChange}
  motionProps={{
    variants: {
      enter: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 }
    }
  }}
>
```

### 6.5 消息提示

**成功提示：**
```tsx
toast.success('操作成功', {
  duration: 3000,
  icon: '✅'
})
```

**错误提示：**
```tsx
toast.error('操作失败', {
  duration: 5000,
  icon: '❌'
})
```

---

## 7. 主题与样式

### 7.1 主题切换

```tsx
// ThemeContext.tsx
const { theme, setTheme } = useTheme()

// 切换主题
<Button onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
  {theme === 'dark' ? <Sun /> : <Moon />}
</Button>
```

### 7.2 Tailwind 配置

```js
// tailwind.config.js
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: { DEFAULT: "#6366F1", foreground: "#FFFFFF" },
            background: "#F9FAFB",
            foreground: "#1E293B",
            divider: "#E2E8F0",
          }
        },
        dark: {
          colors: {
            primary: { DEFAULT: "#6366F1", foreground: "#FFFFFF" },
            background: "#111827",
            foreground: "#F3F4F6",
            divider: "#4B5563",
          }
        }
      }
    })
  ]
}
```

### 7.3 全局样式

```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-thumb {
  background: rgba(107, 114, 128, 0.3);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(107, 114, 128, 0.5);
}

/* 动画 */
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
```

---

## 8. 响应式设计

### 8.1 断点系统

虽然是浏览器扩展，宽度通常固定，但仍支持：

| 断点 | 宽度 | 适配 |
|------|------|------|
| sm | 640px | 窄侧边栏 |
| md | 768px | 标准侧边栏 |
| lg | 1024px | 宽侧边栏 |

### 8.2 自适应布局

**网格响应：**
```tsx
// 导航卡片：窄屏2列，宽屏4列
<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
```

**文字截断：**
```tsx
<p className="truncate max-w-full">长文本...</p>
<p className="line-clamp-3">多行文本...</p>
```

---

## 9. 性能优化

### 9.1 代码分割

```tsx
// 懒加载面板
const NavigationPanel = lazy(() => import('@features/navigation/NavigationPanel'))
const BookmarkPanel = lazy(() => import('@features/bookmark/BookmarkPanel'))
```

### 9.2 虚拟滚动

```tsx
// 大列表使用虚拟滚动（如有需要）
import { Virtuoso } from 'react-virtuoso'

<Virtuoso
  data={items}
  itemContent={(index, item) => <ItemCard item={item} />}
/>
```

### 9.3 防抖搜索

```tsx
const debouncedSearch = useMemo(
  () => debounce((value) => setSearchTerm(value), 300),
  []
)
```

---

## 10. 开发规范

### 10.1 文件组织

```
src/sidepanel/
├── components/        # 通用组件
│   └── chat/
│       ├── ChatInput.tsx
│       ├── ChatMessage.tsx
│       └── MarkdownRenderer.tsx
├── features/          # 功能模块
│   ├── assistant/
│   ├── navigation/
│   ├── bookmark/
│   ├── command/
│   ├── prompt/
│   ├── todo/
│   ├── vault/
│   └── settings/
├── contexts/          # 全局状态
│   ├── ThemeContext.tsx
│   └── TabContext.tsx
├── services/          # 业务逻辑
│   ├── agent/
│   ├── storage.ts
│   └── types.ts
├── styles/            # 样式文件
│   └── globals.css
├── App.tsx            # 主应用
└── main.tsx           # 入口文件
```

### 10.2 命名规范

- **组件**：PascalCase（`NavigationPanel.tsx`）
- **工具函数**：camelCase（`formatDate.ts`）
- **常量**：UPPER_SNAKE_CASE（`MAX_ITEMS`）
- **类型**：PascalCase + Type/Interface 后缀（`ChatMessageType`）

### 10.3 提交规范

```
feat: 新功能
fix: 修复问题
style: 样式调整
refactor: 重构
docs: 文档更新
chore: 构建/工具变更
```

---

## 11. 未来规划

### 11.1 V1.6 计划功能
- [ ] 云同步（跨设备数据同步）
- [ ] 导出/导入配置
- [ ] 多语言支持（i18n）
- [ ] 快捷键系统

### 11.2 V2.0 计划功能
- [ ] 插件系统（支持第三方扩展）
- [ ] 工作区切换（多情景模式）
- [ ] 协作功能（团队共享）
- [ ] 数据分析仪表板

---

## 附录

### A. HeroUI 组件清单

**已使用组件：**
- Button, Input, Card, Avatar, Dropdown, Modal, Accordion
- Checkbox, Switch, Select, Chip, Spinner, Tooltip
- ScrollShadow, Divider, Progress

**待探索组件：**
- Tabs, Table, Pagination, Breadcrumbs
- DatePicker, TimeInput, Slider

### B. 图标资源

**Lucide React 常用图标：**
```tsx
import {
  Bot, Compass, Terminal, Lightbulb, ListTodo,
  Bookmark, Vault, Settings, Send, Trash2,
  User, Sparkles, Sun, Moon, Eye, EyeOff,
  Copy, ExternalLink, Plus, Edit, Check, X
} from 'lucide-react'
```

### C. 参考资源

- HeroUI 官方文档：https://www.heroui.com
- Lucide Icons：https://lucide.dev
- Tailwind CSS：https://tailwindcss.com
- LangChain：https://js.langchain.com

---

**文档维护者：** AG.NEXUS 开发团队
**最后更新：** 2025-12-15
**版本：** V1.5-HeroUI

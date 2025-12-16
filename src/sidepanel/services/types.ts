/**
 * AG.NEXUS - TypeScript 类型定义
 */

// ========== 基础数据类型 ==========

/**
 * 导航项
 */
export interface Nav {
  id: string
  title: string
  url: string
  favicon: string
  createdAt: string
}

export type NavInput = Omit<Nav, 'id' | 'createdAt' | 'favicon'> & {
  favicon?: string
}

/**
 * 收藏项
 */
export interface Bookmark {
  id: string
  title: string
  url: string
  description: string
  createdAt: string
}

export type BookmarkInput = Omit<Bookmark, 'id' | 'createdAt'> & {
  description?: string
}

/**
 * 指令项
 */
export interface Command {
  id: string
  title: string
  code: string
  createdAt: string
}

export type CommandInput = Omit<Command, 'id' | 'createdAt'>

/**
 * 提示词分类
 */
export interface PromptCategory {
  id: string
  name: string
  isDefault?: boolean  // 默认分类不可删除
}

/**
 * 提示词项
 */
export interface Prompt {
  id: string
  title: string
  content: string
  tags: string[]
  category: string  // 分类ID
  createdAt: string
}

export type PromptInput = Omit<Prompt, 'id' | 'createdAt'> & {
  tags?: string[]
  category?: string
}

/**
 * 待办项
 */
export interface Todo {
  id: string
  text: string
  dateType: 'today' | 'tomorrow' | 'thisweek' | 'other'
  startDate: string | null
  reminderEnabled: boolean
  reminderTime: string | null
  priority: 'low' | 'medium' | 'high'
  done: boolean
  createdAt: string
}

export type TodoInput = Omit<Todo, 'id' | 'createdAt' | 'done'> & {
  dateType?: 'today' | 'tomorrow' | 'thisweek' | 'other'
  startDate?: string | null
  reminderEnabled?: boolean
  reminderTime?: string | null
  priority?: 'low' | 'medium' | 'high'
}

/**
 * 设置
 */
export interface Settings {
  apiUrl: string
  apiKey: string
  model: string
  theme: 'auto' | 'light' | 'dark'
  floatBallEnabled: boolean
}

/**
 * 聊天消息
 */
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export type ChatMessageInput = Omit<ChatMessage, 'timestamp'>

/**
 * 保险库项
 */
export interface VaultItem {
  id: string
  name: string
  type: string
  value: string
  note: string
  createdAt: string
  updatedAt?: string
}

export type VaultItemInput = Omit<VaultItem, 'id' | 'createdAt' | 'updatedAt'> & {
  type?: string
  note?: string
}

/**
 * 用户资料
 */
export interface UserProfile {
  name: string
  gender: string
}

/**
 * 存储数据结构
 */
export interface StorageData {
  navs: Nav[]
  bookmarks: Bookmark[]
  commands: Command[]
  prompts: Prompt[]
  promptCategories: PromptCategory[]
  todos: Todo[]
  settings: Settings
  chatHistory: ChatMessage[]
  vaultPin: string | null
  vaultItems: VaultItem[]
  userProfile: UserProfile | null
  memoryBank: string
  messageCount: number
  hasAskedUserInfo: boolean
}

/**
 * 存储键类型
 */
export type StorageKey = keyof StorageData

/**
 * 导出数据选项
 */
export interface ExportOptions {
  includeSecrets?: boolean
}

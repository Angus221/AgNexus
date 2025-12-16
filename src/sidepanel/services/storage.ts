/**
 * AG.NEXUS - 存储管理模块 (TypeScript)
 * 使用 chrome.storage.local 进行本地数据持久化
 */

import type {
  Nav,
  NavInput,
  Bookmark,
  BookmarkInput,
  Command,
  CommandInput,
  Prompt,
  PromptInput,
  PromptCategory,
  Todo,
  TodoInput,
  Settings,
  ChatMessage,
  ChatMessageInput,
  VaultItem,
  VaultItemInput,
  UserProfile,
  StorageData,
  StorageKey,
  ExportOptions,
} from './types'

class StorageService {
  // 默认数据结构
  private defaults: StorageData = {
    navs: [],
    bookmarks: [],
    commands: [],
    prompts: [],
    promptCategories: [
      { id: 'programming', name: '编程', isDefault: true },
      { id: 'role', name: '角色', isDefault: true },
      { id: 'image', name: '生图', isDefault: true },
      { id: 'copywriting', name: '文案', isDefault: true },
      { id: 'video', name: '视频', isDefault: true },
    ],
    todos: [],
    settings: {
      apiUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      apiKey: '',
      model: 'qwen-turbo',
      theme: 'auto',
      floatBallEnabled: true,
    },
    chatHistory: [],
    vaultPin: null,
    vaultItems: [],
    userProfile: null,
    memoryBank: '',
    messageCount: 0,
    hasAskedUserInfo: false,
  }

  /**
   * 获取所有数据
   */
  async getAll(): Promise<StorageData> {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(null, (data) => {
          resolve({ ...this.defaults, ...data } as StorageData)
        })
      } else {
        const data: Partial<StorageData> = {}
        for (const key of Object.keys(this.defaults)) {
          const value = localStorage.getItem(`ag_nexus_${key}`)
          if (value) {
            try {
              data[key as StorageKey] = JSON.parse(value) as any
            } catch (e) {
              data[key as StorageKey] = this.defaults[key as StorageKey] as any
            }
          }
        }
        resolve({ ...this.defaults, ...data })
      }
    })
  }

  /**
   * 获取指定键的数据
   */
  async get<K extends StorageKey>(key: K): Promise<StorageData[K]> {
    const all = await this.getAll()
    return all[key] ?? this.defaults[key]
  }

  /**
   * 设置数据
   */
  async set<K extends StorageKey>(key: K, value: StorageData[K]): Promise<void> {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ [key]: value }, resolve)
      } else {
        localStorage.setItem(`ag_nexus_${key}`, JSON.stringify(value))
        resolve()
      }
    })
  }

  /**
   * 批量设置数据
   */
  async setMultiple(data: Partial<StorageData>): Promise<void> {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set(data, resolve)
      } else {
        for (const [key, value] of Object.entries(data)) {
          localStorage.setItem(`ag_nexus_${key}`, JSON.stringify(value))
        }
        resolve()
      }
    })
  }

  // ========== 导航操作 ==========
  async getNavs(): Promise<Nav[]> {
    return this.get('navs')
  }

  async addNav(nav: NavInput): Promise<Nav> {
    const navs = await this.getNavs()
    const newNav: Nav = {
      id: Date.now().toString(),
      title: nav.title,
      url: nav.url,
      favicon: nav.favicon || this.getFaviconUrl(nav.url),
      createdAt: new Date().toISOString(),
    }
    navs.push(newNav)
    await this.set('navs', navs)
    return newNav
  }

  async removeNav(id: string): Promise<void> {
    const navs = await this.getNavs()
    const filtered = navs.filter((n) => n.id !== id)
    await this.set('navs', filtered)
  }

  private getFaviconUrl(url: string): string {
    try {
      const domain = new URL(url).hostname
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
    } catch {
      return ''
    }
  }

  // ========== 收藏操作 ==========
  async getBookmarks(): Promise<Bookmark[]> {
    return this.get('bookmarks')
  }

  async addBookmark(bookmark: BookmarkInput): Promise<Bookmark> {
    const bookmarks = await this.getBookmarks()
    const newBookmark: Bookmark = {
      id: Date.now().toString(),
      title: bookmark.title,
      url: bookmark.url,
      description: bookmark.description || '',
      createdAt: new Date().toISOString(),
    }
    bookmarks.unshift(newBookmark)
    await this.set('bookmarks', bookmarks)
    return newBookmark
  }

  async removeBookmark(id: string): Promise<void> {
    const bookmarks = await this.getBookmarks()
    const filtered = bookmarks.filter((b) => b.id !== id)
    await this.set('bookmarks', filtered)
  }

  // ========== 指令操作 ==========
  async getCommands(): Promise<Command[]> {
    return this.get('commands')
  }

  async addCommand(cmd: CommandInput): Promise<Command> {
    const commands = await this.getCommands()
    const newCmd: Command = {
      id: Date.now().toString(),
      title: cmd.title,
      code: cmd.code,
      createdAt: new Date().toISOString(),
    }
    commands.push(newCmd)
    await this.set('commands', commands)
    return newCmd
  }

  async removeCommand(id: string): Promise<void> {
    const commands = await this.getCommands()
    const filtered = commands.filter((c) => c.id !== id)
    await this.set('commands', filtered)
  }

  // ========== 提示词分类操作 ==========
  async getPromptCategories(): Promise<PromptCategory[]> {
    return this.get('promptCategories')
  }

  async addPromptCategory(name: string): Promise<PromptCategory> {
    const categories = await this.getPromptCategories()
    const newCategory: PromptCategory = {
      id: Date.now().toString(),
      name,
      isDefault: false,
    }
    categories.push(newCategory)
    await this.set('promptCategories', categories)
    return newCategory
  }

  async removePromptCategory(id: string): Promise<void> {
    const categories = await this.getPromptCategories()
    const category = categories.find((c) => c.id === id)
    if (category?.isDefault) {
      throw new Error('默认分类不可删除')
    }
    const filtered = categories.filter((c) => c.id !== id)
    await this.set('promptCategories', filtered)
  }

  // ========== 提示词操作 ==========
  async getPrompts(): Promise<Prompt[]> {
    return this.get('prompts')
  }

  async addPrompt(prompt: PromptInput): Promise<Prompt> {
    const prompts = await this.getPrompts()
    const newPrompt: Prompt = {
      id: Date.now().toString(),
      title: prompt.title,
      content: prompt.content,
      tags: prompt.tags || [],
      category: prompt.category || 'programming',
      createdAt: new Date().toISOString(),
    }
    prompts.push(newPrompt)
    await this.set('prompts', prompts)
    return newPrompt
  }

  async updatePrompt(id: string, data: Partial<Prompt>): Promise<Prompt | null> {
    const prompts = await this.getPrompts()
    const index = prompts.findIndex((p) => p.id === id)
    if (index !== -1) {
      prompts[index] = { ...prompts[index], ...data }
      await this.set('prompts', prompts)
      return prompts[index]
    }
    return null
  }

  async removePrompt(id: string): Promise<void> {
    const prompts = await this.getPrompts()
    const filtered = prompts.filter((p) => p.id !== id)
    await this.set('prompts', filtered)
  }

  // ========== 待办操作 ==========
  async getTodos(): Promise<Todo[]> {
    return this.get('todos')
  }

  async addTodo(todo: TodoInput): Promise<Todo> {
    const todos = await this.getTodos()
    const newTodo: Todo = {
      id: Date.now().toString(),
      text: todo.text,
      dateType: todo.dateType || 'today',
      startDate: todo.startDate || null,
      reminderEnabled: todo.reminderEnabled || false,
      reminderTime: todo.reminderTime || null,
      priority: todo.priority || 'low',
      done: false,
      createdAt: new Date().toISOString(),
    }
    todos.unshift(newTodo)
    await this.set('todos', todos)
    return newTodo
  }

  async updateTodo(id: string, data: Partial<Todo>): Promise<Todo | null> {
    const todos = await this.getTodos()
    const index = todos.findIndex((t) => t.id === id)
    if (index !== -1) {
      todos[index] = { ...todos[index], ...data }
      await this.set('todos', todos)
      return todos[index]
    }
    return null
  }

  async removeTodo(id: string): Promise<void> {
    const todos = await this.getTodos()
    const filtered = todos.filter((t) => t.id !== id)
    await this.set('todos', filtered)
  }

  // ========== 设置操作 ==========
  async getSettings(): Promise<Settings> {
    return this.get('settings')
  }

  async updateSettings(settings: Partial<Settings>): Promise<Settings> {
    const current = await this.getSettings()
    const updated = { ...current, ...settings }
    await this.set('settings', updated)
    return updated
  }

  // ========== 聊天历史 ==========
  async getChatHistory(): Promise<ChatMessage[]> {
    return this.get('chatHistory')
  }

  async addChatMessage(message: ChatMessageInput): Promise<ChatMessage> {
    const history = await this.getChatHistory()
    const newMessage: ChatMessage = {
      ...message,
      timestamp: new Date().toISOString(),
    }
    history.push(newMessage)

    // 限制历史对话为20条，超过则删除最旧的
    if (history.length > 20) {
      history.shift()
    }
    await this.set('chatHistory', history)

    // 增加消息计数
    const count = await this.getMessageCount()
    await this.set('messageCount', count + 1)

    return newMessage
  }

  async clearChatHistory(): Promise<void> {
    await this.set('chatHistory', [])
  }

  // ========== 用户信息和记忆 ==========
  async getUserProfile(): Promise<UserProfile | null> {
    return this.get('userProfile')
  }

  async setUserProfile(profile: UserProfile): Promise<void> {
    await this.set('userProfile', profile)
  }

  async getMemoryBank(): Promise<string> {
    return this.get('memoryBank')
  }

  async setMemoryBank(memory: string): Promise<void> {
    // 限制记忆最多800字
    let finalMemory = memory
    if (memory && memory.length > 800) {
      finalMemory = memory.substring(0, 800)
    }
    await this.set('memoryBank', finalMemory)
  }

  async getMessageCount(): Promise<number> {
    return this.get('messageCount')
  }

  async resetMessageCount(): Promise<void> {
    await this.set('messageCount', 0)
  }

  async getHasAskedUserInfo(): Promise<boolean> {
    return this.get('hasAskedUserInfo')
  }

  async setHasAskedUserInfo(value: boolean): Promise<void> {
    await this.set('hasAskedUserInfo', value)
  }

  // ========== 数据导入导出 ==========
  async exportData(options: ExportOptions = {}): Promise<StorageData> {
    const { includeSecrets = false } = options
    const data = await this.getAll()
    const exportData = { ...data }

    // 如果不包含敏感信息，清空API密钥
    if (!includeSecrets && exportData.settings) {
      exportData.settings = { ...exportData.settings, apiKey: '' }
    }

    // 如果不包含敏感信息，清空保险库数据
    if (!includeSecrets) {
      exportData.vaultPin = null
      exportData.vaultItems = []
    }

    return exportData
  }

  async importData(data: Partial<StorageData>): Promise<void> {
    const currentSettings = await this.getSettings()
    if (data.settings && currentSettings.apiKey) {
      data.settings.apiKey = currentSettings.apiKey
    }
    await this.setMultiple(data)
  }

  // ========== 保险库操作 ==========
  async getVaultPin(): Promise<string | null> {
    return this.get('vaultPin')
  }

  async setVaultPin(pin: string): Promise<void> {
    await this.set('vaultPin', pin)
  }

  async getVaultItems(): Promise<VaultItem[]> {
    return this.get('vaultItems')
  }

  async addVaultItem(item: VaultItemInput): Promise<VaultItem> {
    const items = await this.getVaultItems()
    const newItem: VaultItem = {
      id: Date.now().toString(),
      name: item.name,
      type: item.type || 'password',
      value: item.value,
      note: item.note || '',
      createdAt: new Date().toISOString(),
    }
    items.push(newItem)
    await this.set('vaultItems', items)
    return newItem
  }

  async updateVaultItem(id: string, data: Partial<VaultItem>): Promise<VaultItem | null> {
    const items = await this.getVaultItems()
    const index = items.findIndex((i) => i.id === id)
    if (index !== -1) {
      items[index] = {
        ...items[index],
        ...data,
        updatedAt: new Date().toISOString(),
      }
      await this.set('vaultItems', items)
      return items[index]
    }
    return null
  }

  async removeVaultItem(id: string): Promise<void> {
    const items = await this.getVaultItems()
    const filtered = items.filter((i) => i.id !== id)
    await this.set('vaultItems', filtered)
  }
}

// 导出单例实例
export const Storage = new StorageService()

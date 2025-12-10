/**
 * AG Nexus - 存储管理模块
 * 使用 chrome.storage.local 进行本地数据持久化
 */

const Storage = {
  // 默认数据结构
  defaults: {
    navs: [],
    bookmarks: [],
    commands: [],
    prompts: [],
    todos: [],
    settings: {
      apiUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      apiKey: '',
      model: 'qwen-turbo',
      theme: 'auto',
      floatBallEnabled: true
    },
    chatHistory: [],
    vaultPin: null,
    vaultItems: [],
    userProfile: null, // 用户信息：{ name: '', gender: '' }
    memoryBank: '', // 压缩的记忆（最多800字）
    messageCount: 0, // 消息计数器
    hasAskedUserInfo: false // 是否已询问过用户信息
  },

  /**
   * 获取所有数据
   */
  async getAll() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(null, (data) => {
          resolve({ ...this.defaults, ...data });
        });
      } else {
        const data = {};
        for (const key of Object.keys(this.defaults)) {
          const value = localStorage.getItem(`ag_nexus_${key}`);
          if (value) {
            try {
              data[key] = JSON.parse(value);
            } catch (e) {
              data[key] = this.defaults[key];
            }
          }
        }
        resolve({ ...this.defaults, ...data });
      }
    });
  },

  /**
   * 获取指定键的数据
   */
  async get(key) {
    const all = await this.getAll();
    return all[key] ?? this.defaults[key];
  },

  /**
   * 设置数据
   */
  async set(key, value) {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ [key]: value }, resolve);
      } else {
        localStorage.setItem(`ag_nexus_${key}`, JSON.stringify(value));
        resolve();
      }
    });
  },

  /**
   * 批量设置数据
   */
  async setMultiple(data) {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set(data, resolve);
      } else {
        for (const [key, value] of Object.entries(data)) {
          localStorage.setItem(`ag_nexus_${key}`, JSON.stringify(value));
        }
        resolve();
      }
    });
  },

  // ========== 导航操作 ==========
  async getNavs() {
    return this.get('navs');
  },

  async addNav(nav) {
    const navs = await this.getNavs();
    const newNav = {
      id: Date.now().toString(),
      title: nav.title,
      url: nav.url,
      favicon: nav.favicon || this.getFaviconUrl(nav.url),
      createdAt: new Date().toISOString()
    };
    navs.push(newNav);
    await this.set('navs', navs);
    return newNav;
  },

  async removeNav(id) {
    const navs = await this.getNavs();
    const filtered = navs.filter(n => n.id !== id);
    await this.set('navs', filtered);
  },

  getFaviconUrl(url) {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch {
      return '';
    }
  },

  // ========== 收藏操作 ==========
  async getBookmarks() {
    return this.get('bookmarks');
  },

  async addBookmark(bookmark) {
    const bookmarks = await this.getBookmarks();
    const newBookmark = {
      id: Date.now().toString(),
      title: bookmark.title,
      url: bookmark.url,
      description: bookmark.description || '',
      createdAt: new Date().toISOString()
    };
    bookmarks.unshift(newBookmark);
    await this.set('bookmarks', bookmarks);
    return newBookmark;
  },

  async removeBookmark(id) {
    const bookmarks = await this.getBookmarks();
    const filtered = bookmarks.filter(b => b.id !== id);
    await this.set('bookmarks', filtered);
  },

  // ========== 指令操作 ==========
  async getCommands() {
    return this.get('commands');
  },

  async addCommand(cmd) {
    const commands = await this.getCommands();
    const newCmd = {
      id: Date.now().toString(),
      title: cmd.title,
      code: cmd.code,
      createdAt: new Date().toISOString()
    };
    commands.push(newCmd);
    await this.set('commands', commands);
    return newCmd;
  },

  async removeCommand(id) {
    const commands = await this.getCommands();
    const filtered = commands.filter(c => c.id !== id);
    await this.set('commands', filtered);
  },

  // ========== 提示词操作 ==========
  async getPrompts() {
    return this.get('prompts');
  },

  async addPrompt(prompt) {
    const prompts = await this.getPrompts();
    const newPrompt = {
      id: Date.now().toString(),
      title: prompt.title,
      content: prompt.content,
      tags: prompt.tags || [],
      createdAt: new Date().toISOString()
    };
    prompts.push(newPrompt);
    await this.set('prompts', prompts);
    return newPrompt;
  },

  async updatePrompt(id, data) {
    const prompts = await this.getPrompts();
    const index = prompts.findIndex(p => p.id === id);
    if (index !== -1) {
      prompts[index] = { ...prompts[index], ...data };
      await this.set('prompts', prompts);
      return prompts[index];
    }
    return null;
  },

  async removePrompt(id) {
    const prompts = await this.getPrompts();
    const filtered = prompts.filter(p => p.id !== id);
    await this.set('prompts', filtered);
  },

  // ========== 待办操作 ==========
  async getTodos() {
    return this.get('todos');
  },

  async addTodo(todo) {
    const todos = await this.getTodos();
    const newTodo = {
      id: Date.now().toString(),
      text: todo.text,
      dateType: todo.dateType || 'today',
      startDate: todo.startDate || null,
      reminderEnabled: todo.reminderEnabled || false,
      reminderTime: todo.reminderTime || null,
      priority: todo.priority || 'low', // low, medium, high
      done: false,
      createdAt: new Date().toISOString()
    };
    todos.unshift(newTodo);
    await this.set('todos', todos);
    return newTodo;
  },

  async updateTodo(id, data) {
    const todos = await this.getTodos();
    const index = todos.findIndex(t => t.id === id);
    if (index !== -1) {
      todos[index] = { ...todos[index], ...data };
      await this.set('todos', todos);
      return todos[index];
    }
    return null;
  },

  async removeTodo(id) {
    const todos = await this.getTodos();
    const filtered = todos.filter(t => t.id !== id);
    await this.set('todos', filtered);
  },

  // ========== 设置操作 ==========
  async getSettings() {
    return this.get('settings');
  },

  async updateSettings(settings) {
    const current = await this.getSettings();
    const updated = { ...current, ...settings };
    await this.set('settings', updated);
    return updated;
  },

  // ========== 聊天历史 ==========
  async getChatHistory() {
    return this.get('chatHistory');
  },

  async addChatMessage(message) {
    const history = await this.getChatHistory();
    history.push({
      ...message,
      timestamp: new Date().toISOString()
    });
    // 限制历史对话为20条，超过则删除最旧的
    if (history.length > 20) {
      history.shift(); // 删除第一条（最旧的）
    }
    await this.set('chatHistory', history);

    // 增加消息计数
    const count = await this.getMessageCount();
    await this.set('messageCount', count + 1);

    return message;
  },

  async clearChatHistory() {
    await this.set('chatHistory', []);
  },

  // ========== 用户信息和记忆 ==========
  async getUserProfile() {
    return this.get('userProfile');
  },

  async setUserProfile(profile) {
    await this.set('userProfile', profile);
  },

  async getMemoryBank() {
    return this.get('memoryBank');
  },

  async setMemoryBank(memory) {
    // 限制记忆最多800字
    if (memory && memory.length > 800) {
      memory = memory.substring(0, 800);
    }
    await this.set('memoryBank', memory);
  },

  async getMessageCount() {
    return this.get('messageCount');
  },

  async resetMessageCount() {
    await this.set('messageCount', 0);
  },

  async getHasAskedUserInfo() {
    return this.get('hasAskedUserInfo');
  },

  async setHasAskedUserInfo(value) {
    await this.set('hasAskedUserInfo', value);
  },

  // ========== 数据导入导出 ==========
  async exportData(includeSecrets = false) {
    const data = await this.getAll();
    const exportData = { ...data };

    // 如果不包含敏感信息，清空API密钥
    if (!includeSecrets && exportData.settings) {
      exportData.settings = { ...exportData.settings, apiKey: '' };
    }

    // 如果不包含敏感信息，清空保险库数据
    if (!includeSecrets) {
      exportData.vaultPin = null;
      exportData.vaultItems = [];
    }

    return exportData;
  },

  async importData(data) {
    const currentSettings = await this.getSettings();
    if (data.settings && currentSettings.apiKey) {
      data.settings.apiKey = currentSettings.apiKey;
    }
    await this.setMultiple(data);
  },

  // ========== 保险库操作 ==========
  async getVaultPin() {
    return this.get('vaultPin');
  },

  async setVaultPin(pin) {
    await this.set('vaultPin', pin);
  },

  async getVaultItems() {
    return this.get('vaultItems');
  },

  async addVaultItem(item) {
    const items = await this.getVaultItems();
    const newItem = {
      id: Date.now().toString(),
      name: item.name,
      type: item.type || 'password',
      value: item.value,
      note: item.note || '',
      createdAt: new Date().toISOString()
    };
    items.push(newItem);
    await this.set('vaultItems', items);
    return newItem;
  },

  async updateVaultItem(id, data) {
    const items = await this.getVaultItems();
    const index = items.findIndex(i => i.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...data, updatedAt: new Date().toISOString() };
      await this.set('vaultItems', items);
      return items[index];
    }
    return null;
  },

  async removeVaultItem(id) {
    const items = await this.getVaultItems();
    const filtered = items.filter(i => i.id !== id);
    await this.set('vaultItems', filtered);
  }
};

window.Storage = Storage;

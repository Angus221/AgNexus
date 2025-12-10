/**
 * AG Nexus - 设置模块
 */

const Settings = {
  modal: null,

  init() {
    this.modal = document.getElementById('settings-modal');
    this.bindEvents();
    this.loadSettings();
    this.initTheme();

    // 监听标签切换，切换到设置页面时重新加载
    window.addEventListener('tabChange', (e) => {
      if (e.detail.tab === 'settings') {
        this.loadSettings();
      }
    });
  },

  bindEvents() {
    // 打开设置 - 通过下拉菜单触发，在 vault.js 中处理

    // 关闭设置
    document.getElementById('settings-close')?.addEventListener('click', () => {
      this.hideModal();
    });

    // 点击遮罩关闭
    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal) this.hideModal();
    });

    // 保存设置
    document.getElementById('settings-save')?.addEventListener('click', () => {
      this.saveSettings();
    });

    // 导出数据
    document.getElementById('settings-export')?.addEventListener('click', () => {
      this.exportData();
    });

    // 导入数据
    document.getElementById('settings-import')?.addEventListener('click', () => {
      document.getElementById('import-file').click();
    });

    document.getElementById('import-file')?.addEventListener('change', (e) => {
      this.importData(e.target.files[0]);
      e.target.value = '';
    });
  },

  async loadSettings() {
    const settings = await Storage.getSettings();
    document.getElementById('settings-api-url').value = settings.apiUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
    document.getElementById('settings-api-key').value = settings.apiKey || '';
    document.getElementById('settings-model').value = settings.model || 'qwen-turbo';
    document.getElementById('settings-float-ball').checked = settings.floatBallEnabled !== false; // 默认为true
  },

  async saveSettings() {
    const apiUrl = document.getElementById('settings-api-url').value.trim();
    const apiKey = document.getElementById('settings-api-key').value.trim();
    const model = document.getElementById('settings-model').value.trim();
    const floatBallEnabled = document.getElementById('settings-float-ball').checked;

    // 检查是否是首次设置API key
    const oldSettings = await Storage.getSettings();
    const isFirstTimeSetup = !oldSettings.apiKey && apiKey;

    // 检查是否没有聊天记录
    const chatHistory = await Storage.getChatHistory();
    const hasNoChatHistory = chatHistory.length === 0;

    await Storage.updateSettings({
      apiUrl: apiUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      apiKey,
      model: model || 'qwen-turbo',
      floatBallEnabled
    });

    // 通知background更新悬浮球状态
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({
        type: 'UPDATE_FLOAT_BALL',
        enabled: floatBallEnabled
      });
    }

    Toast.show('设置已保存', 'success');

    // 如果是首次设置且没有聊天记录，主动问候
    if (isFirstTimeSetup && hasNoChatHistory && window.Assistant) {
      // 切换到助手面板
      setTimeout(() => {
        Tabs.switchTab('assistant');

        // 延迟一下确保面板切换完成
        setTimeout(() => {
          // 清空之前的欢迎消息（如果有）
          const chatContainer = document.getElementById('chat-messages');
          if (chatContainer) {
            chatContainer.innerHTML = '';
          }

          // 发送主动问候消息
          Assistant.addMessage('assistant', '你好呀！我是AG Nexus 助理，你可以叫我小G。✨\n\n那我要怎么称呼你呀~，你是小哥哥还是小姐姐呀，好想认识一下你呀~\n\n不想告诉我说"跳过"也行~');

          // 标记已询问过，避免重复
          Storage.setHasAskedUserInfo(true);
        }, 100);
      }, 500);
    }
  },

  showModal() {
    this.loadSettings();
    this.modal.classList.add('show');
  },

  hideModal() {
    this.modal.classList.remove('show');
  },

  initTheme() {
    // 检测系统主题
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    // 监听系统主题变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    });
  },

  async exportData() {
    const includeSecrets = document.getElementById('export-include-secrets')?.checked || false;
    const data = await Storage.exportData(includeSecrets);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const suffix = includeSecrets ? '-full' : '';
    a.download = `ag-nexus-backup${suffix}-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    Toast.show('数据已导出', 'success');
  },

  async importData(file) {
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await Storage.importData(data);

      // 刷新所有模块
      Navigation.render();
      Command.render();
      Prompt.render();
      Todo.render();

      // 刷新助理（可能导入了用户信息和记忆）
      if (window.Assistant) {
        // 清空并重新加载历史
        const chatContainer = document.getElementById('chat-messages');
        if (chatContainer) {
          chatContainer.innerHTML = '';
        }
        Assistant.loadHistory();
      }

      Toast.show('数据已导入', 'success');
    } catch (e) {
      Toast.show('导入失败：文件格式错误', 'error');
    }
  }
};

window.Settings = Settings;

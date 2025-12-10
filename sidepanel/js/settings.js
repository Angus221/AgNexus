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

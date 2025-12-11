/**
 * AG Nexus - 主入口
 */

// Toast 通知工具
const Toast = {
  el: null,
  timeout: null,

  init() {
    this.el = document.getElementById('toast');
  },

  show(message, type = 'default') {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.el.textContent = message;
    this.el.className = `toast ${type}`;

    // 触发重排以重新播放动画
    void this.el.offsetWidth;

    this.el.classList.add('show');

    this.timeout = setTimeout(() => {
      this.el.classList.remove('show');
    }, 2000);
  }
};

window.Toast = Toast;

// 应用初始化
const App = {
  async init() {
    console.log('AG Nexus 初始化中...');

    // 初始化 Toast
    Toast.init();

    // 初始化主题（需要最先初始化，避免闪烁）
    await Theme.init();

    // 初始化各模块
    Settings.init();
    Vault.init();
    Tabs.init();
    Navigation.init();
    Bookmark.init();
    Command.init();
    Prompt.init();
    Todo.init();
    Assistant.init();

    // 监听标签切换，刷新助理面板滚动
    window.addEventListener('tabChange', (e) => {
      if (e.detail.tab === 'assistant') {
        Assistant.scrollToBottom();
      }
    });

    console.log('AG Nexus 初始化完成');
  }
};

// DOM 加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

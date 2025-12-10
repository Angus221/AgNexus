/**
 * AG Nexus - 标签切换模块
 */

const Tabs = {
  currentTab: 'assistant',

  init() {
    this.bindEvents();
    this.switchTo(this.currentTab);
  },

  bindEvents() {
    // 标签点击事件
    document.querySelectorAll('.tab-item').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        this.switchTo(tabName);
      });
    });
  },

  switchTo(tabName) {
    this.currentTab = tabName;

    // 更新标签高亮
    document.querySelectorAll('.tab-item').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // 切换面板显示
    document.querySelectorAll('.panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `panel-${tabName}`);
    });

    // 显示/隐藏底部输入区
    const footer = document.getElementById('chat-footer');
    footer.classList.toggle('visible', tabName === 'assistant');

    // 触发面板激活事件
    window.dispatchEvent(new CustomEvent('tabChange', { detail: { tab: tabName } }));
  },

  getCurrent() {
    return this.currentTab;
  },

  // 提供 switchTab 别名方法
  switchTab(tabName) {
    this.switchTo(tabName);
  }
};

window.Tabs = Tabs;

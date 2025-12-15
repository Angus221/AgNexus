/**
 * AG Nexus - 主题切换模块
 */

const Theme = {
  currentTheme: 'light', // 默认亮色模式

  async init() {
    console.log('主题模块初始化...');

    // 从存储中加载主题设置
    await this.loadTheme();

    // 绑定单选按钮事件
    this.bindEvents();

    // 更新单选按钮状态
    this.updateRadioButtons();
  },

  async loadTheme() {
    try {
      const result = await chrome.storage.local.get(['theme']);
      // 默认为 light，除非明确设置为 dark
      this.currentTheme = result.theme || 'light';
      this.applyTheme(this.currentTheme);
      console.log('加载主题:', this.currentTheme);
    } catch (error) {
      console.error('加载主题失败:', error);
      // 出错时使用默认亮色主题
      this.currentTheme = 'light';
      this.applyTheme('light');
    }
  },

  bindEvents() {
    // 监听亮色模式单选按钮
    const lightRadio = document.getElementById('theme-light');
    if (lightRadio) {
      lightRadio.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.setTheme('light');
        }
      });
    }

    // 监听暗色模式单选按钮
    const darkRadio = document.getElementById('theme-dark');
    if (darkRadio) {
      darkRadio.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.setTheme('dark');
        }
      });
    }
  },

  setTheme(theme) {
    this.currentTheme = theme;

    // 应用主题
    this.applyTheme(theme);

    // 保存到存储
    this.saveTheme(theme);

    console.log('设置主题为:', theme);
  },

  applyTheme(theme) {
    // 设置 data-theme 属性
    document.documentElement.setAttribute('data-theme', theme);
  },

  async saveTheme(theme) {
    try {
      await chrome.storage.local.set({ theme: theme });
      console.log('主题已保存:', theme);
    } catch (error) {
      console.error('保存主题失败:', error);
    }
  },

  updateRadioButtons() {
    const lightRadio = document.getElementById('theme-light');
    const darkRadio = document.getElementById('theme-dark');

    if (this.currentTheme === 'light') {
      if (lightRadio) lightRadio.checked = true;
      if (darkRadio) darkRadio.checked = false;
    } else {
      if (lightRadio) lightRadio.checked = false;
      if (darkRadio) darkRadio.checked = true;
    }
  }
};

// 暴露到全局
window.Theme = Theme;

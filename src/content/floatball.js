/**
 * AG Nexus - 悬浮球 (Refactored with Shadow DOM & HeroUI Style)
 */
(function () {
  'use strict';

  if (window.__AG_NEXUS_FLOAT_BALL__) return;
  window.__AG_NEXUS_FLOAT_BALL__ = true;

  class FloatBall {
    constructor() {
      this.root = null; // Shadow Host
      this.shadow = null; // Shadow Root
      this.ball = null;
      this.tooltip = null;
      this.checkInterval = null;
      
      this.init();
    }

    init() {
      // 等待 body 就绪
      if (!document.body) {
        setTimeout(() => this.init(), 100);
        return;
      }

      this.checkSettingsAndCreate();
      this.startObserver();
      this.bindMessageListener();
    }

    checkSettingsAndCreate() {
      chrome.storage.local.get(['settings'], (result) => {
        const enabled = result.settings?.floatBallEnabled !== false;
        if (enabled) this.create();
      });
    }

    create() {
      if (this.root) return;

      // 1. 创建 Shadow Host
      this.root = document.createElement('div');
      this.root.id = 'ag-nexus-root';
      Object.assign(this.root.style, {
        position: 'fixed',
        zIndex: '2147483647', // Max Z-Index
        top: '0',
        left: '0',
        width: '0',
        height: '0',
        overflow: 'visible'
      });

      // 2. 创建 Shadow DOM (实现样式隔离的核心)
      this.shadow = this.root.attachShadow({ mode: 'open' });

      // 3. 注入 HeroUI 风格的样式
      const style = document.createElement('style');
      style.textContent = this.getStyles();
      this.shadow.appendChild(style);

      // 4. 创建 HTML 结构
      const container = document.createElement('div');
      container.className = 'container';
      container.innerHTML = `
        <div class="float-ball" id="ball">
          <img src="${chrome.runtime.getURL('icons/icon.jpg')}" alt="AI" />
          <span class="badge" style="transform: scale(0);">0</span>
          
          <div class="tooltip">
            <div class="tooltip-content">加载中...</div>
          </div>
        </div>
      `;
      this.shadow.appendChild(container);

      // 5. 挂载到页面
      document.body.appendChild(this.root);

      // 6. 绑定引用和事件
      this.ball = this.shadow.getElementById('ball');
      this.tooltip = this.shadow.querySelector('.tooltip');
      
      this.bindEvents();
      this.startChecking();
    }

    bindEvents() {
      this.ball.addEventListener('click', () => this.openSidePanel());
      this.ball.addEventListener('mouseenter', () => this.updateTooltip());
    }

    // HeroUI 风格的 CSS
    getStyles() {
      return `
        :host { font-family: system-ui, -apple-system, sans-serif; }
        * { box-sizing: border-box; }
        
        .float-ball {
          position: fixed;
          right: 20px;
          bottom: 100px;
          width: 44px; /* HeroUI Button MD size */
          height: 44px;
          background: #ffffff;
          border-radius: 50%;
          /* HeroUI Shadow Medium */
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s;
          user-select: none;
        }

        .float-ball:hover {
          transform: translateY(-2px);
          /* HeroUI Shadow Large */
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }

        .float-ball:active {
          transform: scale(0.95);
        }

        img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #fff; /* White ring */
        }

        /* Badge - 仿 HeroUI Badge */
        .badge {
          position: absolute;
          top: -2px;
          right: -2px;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          background: #F31260; /* HeroUI Danger Color */
          color: white;
          font-size: 10px;
          font-weight: 600;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #fff;
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        /* Tooltip - 仿 HeroUI Tooltip (Dark) */
        .tooltip {
          position: absolute;
          right: 55px;
          bottom: 50%;
          transform: translateY(50%) translateX(10px);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s, transform 0.2s;
          z-index: 10;
        }

        .float-ball:hover .tooltip {
          opacity: 1;
          transform: translateY(50%) translateX(0);
        }

        .tooltip-content {
          background: #18181b; /* HeroUI Zinc-900 */
          color: #fff;
          padding: 8px 12px;
          border-radius: 12px;
          font-size: 12px;
          width: max-content;
          max-width: 260px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          line-height: 1.5;
        }

        /* 呼吸动画 */
        .blink {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(243, 18, 96, 0.7); }
          50% { box-shadow: 0 0 0 10px rgba(243, 18, 96, 0); }
        }
        
        .item { padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .item:last-child { border-bottom: none; }
        .time { color: #a1a1aa; font-size: 10px; margin-left: 6px; }
      `;
    }

    openSidePanel() {
     let retryCount = 0;
    const maxRetries = 3;

    function attemptOpen() {

      // 优先使用直接打开的方式，更可靠
      chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' }, (response) => {
        // 检查是否有错误
        if (chrome.runtime.lastError) {
          console.error('AG Nexus: 打开侧边栏失败', chrome.runtime.lastError);

          // 重试
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(attemptOpen, 300);
          } else {
            console.error('AG Nexus: 打开侧边栏失败，已达到最大重试次数');
            // 显示用户友好的提示
            showErrorTooltip('无法打开侧边栏，请点击扩展图标');
          }
        } else {
          console.log('AG Nexus: 侧边栏已打开');
        }
      });
    }

    attemptOpen();
    }

    async updateTooltip() {
      const todos = await this.getUpcomingTodos();
      const content = this.tooltip.querySelector('.tooltip-content');
      
      if (todos.length === 0) {
        content.innerHTML = '<span style="color:#a1a1aa">暂无待办提醒</span>';
        return;
      }

      const html = todos.slice(0, 3).map(t => `
        <div class="item">
          <div>${this.escape(t.text)}</div>
          <div style="display:flex; justify-content:space-between; align-items:center">
             <span style="color:${t.priority === 'high' ? '#F31260' : '#F5A524'}">●</span>
             <span class="time">${this.getTimeLeft(t)}</span>
          </div>
        </div>
      `).join('');
      
      content.innerHTML = html + (todos.length > 3 ? `<div style="text-align:center; color:#a1a1aa; font-size:10px; margin-top:4px">+${todos.length - 3} 更多</div>` : '');
    }

    async startChecking() {
      this.checkAndUpdate();
      this.checkInterval = setInterval(() => this.checkAndUpdate(), 60000);
    }

    async checkAndUpdate() {
      if (!this.ball) return;
      const todos = await this.getUpcomingTodos();
      const badge = this.shadow.querySelector('.badge');
      
      if (todos.length > 0) {
        badge.textContent = todos.length;
        badge.style.transform = 'scale(1)';
        
        // 紧急闪烁逻辑
        const urgent = todos.some(t => this.isUrgent(t));
        urgent ? this.ball.classList.add('blink') : this.ball.classList.remove('blink');
      } else {
        badge.style.transform = 'scale(0)';
        this.ball.classList.remove('blink');
      }
    }

    // --- 辅助函数保持不变 ---
    async getUpcomingTodos() {
      // ...保留你原有的逻辑...
      // 为演示，这里 mock 了一个返回
           return new Promise((resolve) => {
          chrome.storage.local.get(['todos'], (result) => {
            const todos = result.todos || [];
            const now = new Date();
            const threshold = new Date(now.getTime() + 10 * 60 * 1000); // 30分钟

            const upcoming = todos.filter(t => {
              if (t.done || !t.reminderEnabled || !t.reminderTime || !t.startDate) return false;
              const reminderDateTime = new Date(`${t.startDate}T${t.reminderTime}:00`);
              return reminderDateTime > now && reminderDateTime <= threshold;
            });

            resolve(upcoming);
          });
        });
    }

    isUrgent(todo) {
       // 5分钟内
       if (!todo.reminderTime) return false;
       const target = new Date(`${todo.startDate}T${todo.reminderTime}:00`);
       return (target - Date.now()) < 5 * 60 * 1000;
    }

    getTimeLeft(todo) {
       if (!startDate || !reminderTime) return '';

    const now = new Date();
    const reminderDateTime = new Date(`${startDate}T${reminderTime}:00`);
    const diff = reminderDateTime - now;

    if (diff < 0) return '已过期';

    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '即将到期';
    if (minutes < 60) return `${minutes}分钟后`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时后`;

    const days = Math.floor(hours / 24);
    return `${days}天后`;
    }

    escape(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

  remove() {
      // 1. 停止定时检查
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
        this.checkInterval = null;
      }

      // 2. 停止 DOM 监听 (新增部分)
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }

      // 3. 移除元素
      if (this.root) {
        this.root.remove();
        this.root = null;
      }
    }
    
 startObserver() {
      // 防止重复监听
      if (this.observer) this.observer.disconnect();

      this.observer = new MutationObserver((mutations) => {
        // 检查 this.root 是否还存在于文档中
        if (this.root && !document.body.contains(this.root)) {
          console.log('AG Nexus: 检测到悬浮球被移除，正在重新注入...');
          
          // 关键：先清空引用，create() 方法才会执行新建逻辑
          this.root = null; 
          this.create();
        }
      });

      // 开始监听 body 的子节点变化
      this.observer.observe(document.body, {
        childList: true, // 监听子元素的增减
        subtree: false   // 只需要监听 body 的直接子元素，性能更好
      });
    }

    bindMessageListener() {
      chrome.runtime.onMessage.addListener((msg) => {
        if (msg.type === 'TOGGLE_FLOAT_BALL') msg.enabled ? this.create() : this.remove();
        if (msg.type === 'UPDATE_TODOS') this.checkAndUpdate();
      });
    }
  }

  // 启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new FloatBall());
  } else {
    new FloatBall();
  }
})();
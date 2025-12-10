/**
 * AG Nexus - 悬浮球
 * 显示待办提醒
 */

(function() {
  'use strict';

  // 避免重复注入
  if (window.__AG_NEXUS_FLOAT_BALL__) return;
  window.__AG_NEXUS_FLOAT_BALL__ = true;

  let floatBall = null;
  let reminderPanel = null;
  let checkInterval = null;
  let blinkInterval = null;

  // 创建悬浮球
  function createFloatBall() {
    if (floatBall) return;

    // 创建悬浮球容器
    floatBall = document.createElement('div');
    floatBall.id = 'ag-nexus-float-ball';
    floatBall.innerHTML = `
      <div class="float-ball-icon">
        <img src="${chrome.runtime.getURL('icons/icon.jpg')}" alt="AG Nexus" />
        <span class="float-ball-badge" style="display: none;">0</span>
      </div>
      <div class="float-ball-tooltip" style="display: none;"></div>
    `;

    // 创建提醒面板（保留，备用）
    reminderPanel = document.createElement('div');
    reminderPanel.id = 'ag-nexus-reminder-panel';
    reminderPanel.style.display = 'none';

    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
      #ag-nexus-float-ball {
        position: fixed;
        right: 20px;
        bottom: 80px;
        width: 36px;
        height: 36px;
        background: #ffffff;
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        cursor: pointer;
        z-index: 999999;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        user-select: none;
      }

      #ag-nexus-float-ball:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
      }

      #ag-nexus-float-ball:active {
        transform: scale(0.95);
      }

      #ag-nexus-float-ball.blink {
        animation: ag-nexus-blink 1s ease-in-out infinite;
      }

      @keyframes ag-nexus-blink {
        0%, 100% {
          opacity: 1;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        50% {
          opacity: 0.6;
          box-shadow: 0 4px 20px rgba(220, 38, 38, 0.6);
        }
      }

      .float-ball-icon {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .float-ball-icon img {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        object-fit: cover;
      }

      .float-ball-badge {
        position: absolute;
        top: -2px;
        right: -2px;
        min-width: 20px;
        height: 20px;
        padding: 0 6px;
        background: #DC2626;
        color: white;
        font-size: 12px;
        font-weight: bold;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .float-ball-tooltip {
        position: absolute;
        right: 70px;
        bottom: 0;
        min-width: 200px;
        max-width: 320px;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 13px;
        line-height: 1.5;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        pointer-events: none;
        z-index: 999999;
        opacity: 0;
        transform: translateX(10px);
        transition: all 0.2s ease;
      }

      #ag-nexus-float-ball:hover .float-ball-tooltip {
        opacity: 1;
        transform: translateX(0);
        display: block !important;
      }

      .tooltip-item {
        padding: 4px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .tooltip-item:last-child {
        border-bottom: none;
      }

      .tooltip-text {
        font-weight: 500;
        margin-bottom: 2px;
      }

      .tooltip-time {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.7);
      }

      .tooltip-priority {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 10px;
        font-weight: 600;
        margin-right: 6px;
      }

      .tooltip-priority.high {
        background: #DC2626;
      }

      .tooltip-priority.medium {
        background: #F59E0B;
      }

      #ag-nexus-reminder-panel {
        position: fixed;
        right: 20px;
        bottom: 145px;
        width: 320px;
        max-height: 400px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        overflow: hidden;
        z-index: 999998;
        animation: ag-nexus-slide-up 0.3s ease-out;
      }

      @keyframes ag-nexus-slide-up {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .reminder-header {
        padding: 16px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        font-size: 14px;
        font-weight: 600;
      }

      .reminder-list {
        max-height: 340px;
        overflow-y: auto;
      }

      .reminder-item {
        padding: 12px 16px;
        border-bottom: 1px solid #f0f0f0;
        transition: background 0.2s;
      }

      .reminder-item:hover {
        background: #f9fafb;
      }

      .reminder-item:last-child {
        border-bottom: none;
      }

      .reminder-text {
        font-size: 14px;
        color: #1f2937;
        margin-bottom: 4px;
        font-weight: 500;
      }

      .reminder-time {
        font-size: 12px;
        color: #6b7280;
      }

      .reminder-priority {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        margin-right: 8px;
      }

      .reminder-priority.high {
        background: #fee2e2;
        color: #dc2626;
      }

      .reminder-priority.medium {
        background: #fef3c7;
        color: #b45309;
      }

      .reminder-empty {
        padding: 32px 16px;
        text-align: center;
        color: #9ca3af;
        font-size: 14px;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(floatBall);
    document.body.appendChild(reminderPanel);

    // 绑定事件
    floatBall.addEventListener('click', openSidePanel);

    // 鼠标悬浮时更新tooltip
    floatBall.addEventListener('mouseenter', updateTooltip);

    // 开始检查待办
    startChecking();
  }

  // 移除悬浮球
  function removeFloatBall() {
    stopChecking();
    if (floatBall) {
      floatBall.remove();
      floatBall = null;
    }
    if (reminderPanel) {
      reminderPanel.remove();
      reminderPanel = null;
    }
  }

  // 切换侧边栏
  function openSidePanel() {
    chrome.runtime.sendMessage({ type: 'TOGGLE_SIDE_PANEL' });
  }

  // 更新tooltip内容
  async function updateTooltip() {
    const tooltip = floatBall.querySelector('.float-ball-tooltip');
    const upcomingTodos = await getUpcomingTodos();

    if (upcomingTodos.length === 0) {
      tooltip.innerHTML = '<div style="color: rgba(255,255,255,0.7);">暂无待办提醒</div>';
      tooltip.style.display = 'block';
      return;
    }

    // 只显示前3个
    const todos = upcomingTodos.slice(0, 3);
    const moreCount = upcomingTodos.length - 3;

    const html = todos.map(todo => {
      const timeLeft = getTimeLeft(todo.startDate, todo.reminderTime);
      const priorityLabel = { high: '高', medium: '中', low: '低' }[todo.priority] || '';

      return `
        <div class="tooltip-item">
          ${todo.priority && todo.priority !== 'low' ? `<span class="tooltip-priority ${todo.priority}">${priorityLabel}</span>` : ''}
          <div class="tooltip-text">${escapeHtml(todo.text)}</div>
          <div class="tooltip-time">${timeLeft}</div>
        </div>
      `;
    }).join('');

    const moreText = moreCount > 0 ? `<div style="margin-top:8px;color:rgba(255,255,255,0.6);font-size:11px;">还有 ${moreCount} 个待办...</div>` : '';

    tooltip.innerHTML = html + moreText;
    tooltip.style.display = 'block';
  }

  // 切换提醒面板（保留备用）
  function toggleReminderPanel() {
    if (reminderPanel.style.display === 'none') {
      updateReminderPanel();
      reminderPanel.style.display = 'block';
    } else {
      reminderPanel.style.display = 'none';
    }
  }

  // 更新提醒面板
  async function updateReminderPanel() {
    const upcomingTodos = await getUpcomingTodos();

    if (upcomingTodos.length === 0) {
      reminderPanel.innerHTML = `
        <div class="reminder-header">待办提醒</div>
        <div class="reminder-empty">暂无即将到期的待办事项</div>
      `;
      return;
    }

    const listHtml = upcomingTodos.map(todo => {
      const timeLeft = getTimeLeft(todo.startDate, todo.reminderTime);
      const priorityLabel = { high: '高', medium: '中', low: '低' }[todo.priority] || '低';

      return `
        <div class="reminder-item">
          ${todo.priority && todo.priority !== 'low' ? `<span class="reminder-priority ${todo.priority}">${priorityLabel}</span>` : ''}
          <div class="reminder-text">${escapeHtml(todo.text)}</div>
          <div class="reminder-time">${timeLeft}</div>
        </div>
      `;
    }).join('');

    reminderPanel.innerHTML = `
      <div class="reminder-header">待办提醒 (${upcomingTodos.length})</div>
      <div class="reminder-list">${listHtml}</div>
    `;
  }

  // 获取即将到期的待办(30分钟内)
  async function getUpcomingTodos() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['todos'], (result) => {
        const todos = result.todos || [];
        const now = new Date();
        const threshold = new Date(now.getTime() + 30 * 60 * 1000); // 30分钟

        const upcoming = todos.filter(t => {
          if (t.done || !t.reminderEnabled || !t.reminderTime || !t.startDate) return false;
          const reminderDateTime = new Date(`${t.startDate}T${t.reminderTime}:00`);
          return reminderDateTime > now && reminderDateTime <= threshold;
        });

        resolve(upcoming);
      });
    });
  }

  // 计算剩余时间
  function getTimeLeft(startDate, reminderTime) {
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

  // 开始检查
  function startChecking() {
    // 立即检查一次
    checkAndUpdate();

    // 每分钟检查一次
    checkInterval = setInterval(checkAndUpdate, 60000);
  }

  // 停止检查
  function stopChecking() {
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }
    stopBlinking();
  }

  // 检查并更新
  async function checkAndUpdate() {
    const upcomingTodos = await getUpcomingTodos();
    const count = upcomingTodos.length;

    // 更新角标
    const badge = floatBall.querySelector('.float-ball-badge');
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = 'flex';

      // 检查是否有5分钟内到期的待办
      const urgentTodos = upcomingTodos.filter(t => {
        if (!t.reminderEnabled || !t.reminderTime || !t.startDate) return false;
        const reminderDateTime = new Date(`${t.startDate}T${t.reminderTime}:00`);
        const timeLeft = reminderDateTime - Date.now();
        return timeLeft <= 5 * 60 * 1000; // 5分钟
      });

      if (urgentTodos.length > 0) {
        startBlinking();
      } else {
        stopBlinking();
      }
    } else {
      badge.style.display = 'none';
      stopBlinking();
    }
  }

  // 开始闪烁
  function startBlinking() {
    if (!floatBall.classList.contains('blink')) {
      floatBall.classList.add('blink');
    }
  }

  // 停止闪烁
  function stopBlinking() {
    floatBall.classList.remove('blink');
  }

  // HTML转义
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // 监听来自background的消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'TOGGLE_FLOAT_BALL') {
      if (message.enabled) {
        createFloatBall();
      } else {
        removeFloatBall();
      }
    } else if (message.type === 'UPDATE_TODOS') {
      // 待办数据更新时刷新
      if (floatBall) {
        checkAndUpdate();
      }
    }
  });

  // 初始化 - 检查是否启用悬浮球
  function init() {
    chrome.storage.local.get(['settings'], (result) => {
      const settings = result.settings || {};
      // 默认为true，只有明确设置为false才不显示
      const floatBallEnabled = settings.floatBallEnabled !== false;
      console.log('AG Nexus 悬浮球初始化:', settings, '启用状态:', floatBallEnabled);
      if (floatBallEnabled) {
        console.log('创建悬浮球');
        createFloatBall();
      } else {
        console.log('悬浮球未启用');
      }
    });
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

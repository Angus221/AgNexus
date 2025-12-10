/**
 * AG Nexus - 待办模块
 * 支持开始时间、结束时间、优先级
 * 今日统计
 */

const Todo = {
  container: null,
  statsContainer: null,
  modal: null,
  editingId: null,

  init() {
    this.container = document.getElementById('todo-list');
    this.statsContainer = document.getElementById('todo-stats');
    this.modal = document.getElementById('todo-modal');
    this.bindEvents();
    this.render();
  },

  bindEvents() {
    // 添加按钮
    document.getElementById('todo-add-btn')?.addEventListener('click', () => {
      this.showModal();
    });

    // 模态框关闭
    this.modal?.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', () => this.hideModal());
    });

    // 保存待办
    document.getElementById('todo-save')?.addEventListener('click', () => {
      this.saveTodo();
    });

    // 点击遮罩关闭
    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal) this.hideModal();
    });

    // 日期类型选择
    document.querySelectorAll('input[name="date-type"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        const customDateInput = document.getElementById('todo-custom-date');
        if (e.target.value === 'other') {
          customDateInput.style.display = 'block';
        } else {
          customDateInput.style.display = 'none';
        }
      });
    });

    // 提醒开关
    document.getElementById('todo-reminder-enabled')?.addEventListener('change', (e) => {
      const container = document.getElementById('todo-reminder-time-container');
      if (e.target.checked) {
        container.style.display = 'block';
      } else {
        container.style.display = 'none';
      }
    });
  },

  async render() {
    const todos = await Storage.getTodos();

    // 渲染今日统计
    this.renderStats(todos);

    if (todos.length === 0) {
      this.container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">✅</div>
          <p class="empty-state-text">暂无待办事项</p>
          <div style="font-size: 13px; color: var(--text-tertiary); margin-top: 12px; line-height: 1.6; max-width: 280px;">
            <p style="margin-bottom: 8px;"><strong style="color: var(--text-secondary);">功能说明:</strong></p>
            <p style="margin-bottom: 6px;">• 灵活的时间管理,三级优先级设置</p>
            <p style="margin-bottom: 6px;">• 可选提醒功能,今日统计一目了然</p>
            <p style="margin-bottom: 12px;">• 支持悬浮球倒计时提醒</p>
            <p style="margin-bottom: 6px;"><strong style="color: var(--text-secondary);">使用方式:</strong></p>
            <p>点击右上角 + 号添加任务,或对AI说"记个事,明天下午2点开会"</p>
          </div>
        </div>
      `;
      return;
    }

    // 分离未完成和已完成，按优先级排序
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const pending = todos.filter(t => !t.done).sort((a, b) => {
      return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
    });
    const completed = todos.filter(t => t.done);

    let html = '';

    // 未完成任务
    html += pending.map(todo => this.renderItem(todo)).join('');

    // 已完成任务
    if (completed.length > 0) {
      html += `<div class="list-title" style="margin-top: 16px; margin-bottom: 8px; font-size: 12px; color: var(--text-muted);">已完成 (${completed.length})</div>`;
      html += completed.map(todo => this.renderItem(todo)).join('');
    }

    this.container.innerHTML = html;

    // 绑定事件
    this.container.querySelectorAll('.todo-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const id = e.target.dataset.id;
        this.toggleTodo(id, e.target.checked);
      });
    });

    this.container.querySelectorAll('.todo-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        this.deleteTodo(id);
      });
    });

    // 绑定编辑事件 (点击文本)
    this.container.querySelectorAll('.todo-item').forEach(item => {
      item.addEventListener('dblclick', (e) => {
        if (e.target.closest('.todo-checkbox') || e.target.closest('.todo-delete')) return;
        const id = item.dataset.id;
        this.editTodo(id);
      });
    });
  },

  renderStats(todos) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = this.formatDate(today);

    // 今日任务: 开始日期是今天的
    const todayTodos = todos.filter(t => t.startDate === todayStr);

    const total = todayTodos.length;
    const done = todayTodos.filter(t => t.done).length;
    const highPriority = todayTodos.filter(t => t.priority === 'high' && !t.done).length;

    // 计算即将到期的任务（1小时内有提醒的）
    const now = new Date();
    const soon = todayTodos.filter(t => {
      if (t.done || !t.reminderEnabled || !t.reminderTime) return false;
      const reminderDateTime = new Date(`${t.startDate}T${t.reminderTime}:00`);
      const diff = reminderDateTime - now;
      return diff > 0 && diff <= 60 * 60 * 1000;
    }).length;

    this.statsContainer.innerHTML = `
      <div class="stat-card">
        <div class="stat-value">${total}</div>
        <div class="stat-label">今日任务</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${done}</div>
        <div class="stat-label">已完成</div>
      </div>
      <div class="stat-card ${highPriority > 0 ? 'stat-warning' : ''}">
        <div class="stat-value">${highPriority}</div>
        <div class="stat-label">高优先级</div>
      </div>
      <div class="stat-card ${soon > 0 ? 'stat-alert' : ''}">
        <div class="stat-value">${soon}</div>
        <div class="stat-label">即将到期</div>
      </div>
    `;
  },

  renderItem(todo) {
    const dateLabel = this.getDateLabel(todo.startDate, todo.dateType);
    const timeStr = todo.reminderEnabled && todo.reminderTime ? todo.reminderTime : '';
    const isOverdue = todo.reminderEnabled && todo.reminderTime && !todo.done && this.isOverdue(todo.startDate, todo.reminderTime);
    const priorityClass = todo.priority ? `priority-${todo.priority}` : '';

    return `
      <div class="todo-item ${todo.done ? 'completed' : ''}" data-id="${todo.id}">
        <input type="checkbox" class="checkbox-input todo-checkbox" data-id="${todo.id}" ${todo.done ? 'checked' : ''}>
        <div class="todo-content">
          <span class="todo-text ${todo.done ? 'done' : ''}">${this.escapeHtml(todo.text)}</span>
          <div class="todo-meta">
            ${todo.priority && todo.priority !== 'low' ? `<span class="priority-badge ${priorityClass}">${this.getPriorityLabel(todo.priority)}</span>` : ''}
            ${dateLabel ? `<span class="todo-time">${dateLabel}</span>` : ''}
            ${timeStr ? `<span class="todo-time ${isOverdue ? 'overdue' : ''}">⏰ ${timeStr}</span>` : ''}
          </div>
        </div>
        <button class="btn btn-icon btn-ghost btn-sm btn-delete todo-delete" data-id="${todo.id}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
          </svg>
        </button>
      </div>
    `;
  },

  getPriorityLabel(priority) {
    const labels = { high: '高', medium: '中', low: '低' };
    return labels[priority] || '低';
  },

  async editTodo(id) {
    const todos = await Storage.getTodos();
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    this.editingId = id;
    document.getElementById('todo-modal-title').textContent = '编辑待办';
    document.getElementById('todo-text').value = todo.text;

    // 设置日期选择
    if (todo.startDate) {
      const dateType = todo.dateType || 'other';
      const dateRadios = document.querySelectorAll('input[name="date-type"]');
      dateRadios.forEach(radio => {
        radio.checked = radio.value === dateType;
      });

      if (dateType === 'other') {
        document.getElementById('todo-custom-date').style.display = 'block';
        document.getElementById('todo-custom-date').value = todo.startDate;
      }
    }

    // 设置提醒
    if (todo.reminderEnabled) {
      document.getElementById('todo-reminder-enabled').checked = true;
      document.getElementById('todo-reminder-time-container').style.display = 'block';
      document.getElementById('todo-reminder-time').value = todo.reminderTime || '18:00';
    } else {
      document.getElementById('todo-reminder-enabled').checked = false;
      document.getElementById('todo-reminder-time-container').style.display = 'none';
    }

    // 设置优先级
    const priorityRadios = document.querySelectorAll('input[name="priority"]');
    priorityRadios.forEach(radio => {
      radio.checked = radio.value === (todo.priority || 'low');
    });

    this.modal.classList.add('show');
    document.getElementById('todo-text').focus();
  },

  showModal() {
    this.editingId = null;
    document.getElementById('todo-modal-title').textContent = '添加待办';
    document.getElementById('todo-text').value = '';

    // 重置日期选择为今天
    const dateRadios = document.querySelectorAll('input[name="date-type"]');
    dateRadios.forEach(radio => {
      radio.checked = radio.value === 'today';
    });
    document.getElementById('todo-custom-date').style.display = 'none';
    document.getElementById('todo-custom-date').value = '';

    // 重置提醒
    document.getElementById('todo-reminder-enabled').checked = false;
    document.getElementById('todo-reminder-time-container').style.display = 'none';
    document.getElementById('todo-reminder-time').value = '18:00';

    // 重置优先级为低
    const priorityRadios = document.querySelectorAll('input[name="priority"]');
    priorityRadios.forEach(radio => {
      radio.checked = radio.value === 'low';
    });

    this.modal.classList.add('show');
    document.getElementById('todo-text').focus();
  },

  hideModal() {
    this.modal.classList.remove('show');
    this.editingId = null;
  },

  async saveTodo() {
    const text = document.getElementById('todo-text').value.trim();
    const dateType = document.querySelector('input[name="date-type"]:checked')?.value || 'today';
    const customDate = document.getElementById('todo-custom-date').value;
    const reminderEnabled = document.getElementById('todo-reminder-enabled').checked;
    const reminderTime = document.getElementById('todo-reminder-time').value;
    const priority = document.querySelector('input[name="priority"]:checked')?.value || 'low';

    if (!text) {
      Toast.show('请填写任务内容', 'error');
      return;
    }

    // 计算开始日期
    let startDate;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch(dateType) {
      case 'today':
        startDate = this.formatDate(today);
        break;
      case 'tomorrow':
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        startDate = this.formatDate(tomorrow);
        break;
      case 'thisweek':
        // 本周日
        const sunday = new Date(today);
        const dayOfWeek = today.getDay();
        const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
        sunday.setDate(sunday.getDate() + daysUntilSunday);
        startDate = this.formatDate(sunday);
        break;
      case 'other':
        if (!customDate) {
          Toast.show('请选择具体日期', 'error');
          return;
        }
        startDate = customDate;
        break;
      default:
        startDate = this.formatDate(today);
    }

    const data = {
      text,
      dateType,
      startDate,
      reminderEnabled,
      reminderTime: reminderEnabled ? reminderTime : null,
      priority
    };

    if (this.editingId) {
      await Storage.updateTodo(this.editingId, data);
      Toast.show('已更新待办');
    } else {
      await Storage.addTodo(data);
      Toast.show('已添加待办');
    }

    // 如果开启提醒，设置提醒
    if (reminderEnabled && reminderTime) {
      const reminderDateTime = `${startDate}T${reminderTime}:00`;
      this.scheduleReminder(text, new Date(reminderDateTime).toISOString());
    }

    this.hideModal();
    this.render();
    this.notifyFloatBall();
  },

  async toggleTodo(id, done) {
    const item = this.container.querySelector(`.todo-item[data-id="${id}"]`);

    if (done) {
      // 完成动画
      item.classList.add('completing');
      await new Promise(r => setTimeout(r, 300));
    }

    await Storage.updateTodo(id, { done });
    this.render();
    this.notifyFloatBall();
  },

  async deleteTodo(id) {
    const item = this.container.querySelector(`.todo-item[data-id="${id}"]`);
    item.classList.add('completing');
    await new Promise(r => setTimeout(r, 300));

    await Storage.removeTodo(id);
    this.render();
    this.notifyFloatBall();
  },

  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  getDateLabel(startDate, dateType) {
    if (!startDate) return '';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(startDate);
    date.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((date - today) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return '今天';
    } else if (diffDays === 1) {
      return '明天';
    } else if (diffDays < 0) {
      return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
    } else if (diffDays <= 7) {
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      return weekDays[date.getDay()];
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
    }
  },

  isOverdue(startDate, reminderTime) {
    if (!startDate || !reminderTime) return false;
    const reminderDateTime = new Date(`${startDate}T${reminderTime}:00`);
    return reminderDateTime < new Date();
  },

  scheduleReminder(text, timeStr) {
    if (typeof chrome !== 'undefined' && chrome.alarms) {
      const time = new Date(timeStr).getTime();
      const now = Date.now();
      // 提前5分钟提醒
      const remindTime = time - 5 * 60 * 1000;
      if (remindTime > now) {
        chrome.alarms.create(`todo_${Date.now()}`, { when: remindTime });
      }
    }
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  // 供 AI 助理调用
  async addByAI(data) {
    const todo = await Storage.addTodo(data);
    this.render();
    if (data.endTime) {
      this.scheduleReminder(data.text, data.endTime);
    }
    return todo;
  },

  // 获取即将到期的待办（供悬浮球使用）
  async getUpcoming(minutesBefore = 30) {
    const todos = await Storage.getTodos();
    const now = new Date();
    const threshold = new Date(now.getTime() + minutesBefore * 60 * 1000);

    return todos.filter(t => {
      if (t.done || !t.reminderEnabled || !t.reminderTime || !t.startDate) return false;
      const reminderDateTime = new Date(`${t.startDate}T${t.reminderTime}:00`);
      return reminderDateTime > now && reminderDateTime <= threshold;
    });
  },

  // 通知悬浮球更新
  notifyFloatBall() {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
            chrome.tabs.sendMessage(tab.id, {
              type: 'UPDATE_TODOS'
            }).catch(() => {
              // 忽略错误
            });
          }
        });
      });
    }
  }
};

window.Todo = Todo;

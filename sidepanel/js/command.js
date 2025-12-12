/**
 * AG Nexus - 指令模块
 * 单行显示: 名称: 代码
 * 支持搜索过滤
 */

const Command = {
  container: null,
  modal: null,
  searchInput: null,
  searchKeyword: '',

  init() {
    this.container = document.getElementById('cmd-list');
    this.modal = document.getElementById('cmd-modal');
    this.searchInput = document.getElementById('cmd-search');
    this.bindEvents();
    this.render();
  },

  bindEvents() {
    // 添加按钮
    document.getElementById('cmd-add')?.addEventListener('click', () => {
      this.showModal();
    });

    // 模态框关闭
    this.modal?.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', () => this.hideModal());
    });

    // 保存指令
    document.getElementById('cmd-save')?.addEventListener('click', () => {
      this.saveCommand();
    });

    // 点击遮罩关闭
    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal) this.hideModal();
    });

    // 搜索
    this.searchInput?.addEventListener('input', (e) => {
      this.searchKeyword = e.target.value.trim().toLowerCase();
      this.render();
    });

    // 监听标签页切换事件，切换到指令页面时刷新数据
    window.addEventListener('tabChange', (e) => {
      if (e.detail.tab === 'command') {
        this.render();
      }
    });
  },

  async render() {
    let commands = await Storage.getCommands();

    // 搜索过滤
    if (this.searchKeyword) {
      commands = commands.filter(c =>
        c.title.toLowerCase().includes(this.searchKeyword) ||
        c.code.toLowerCase().includes(this.searchKeyword)
      );
    }

    if (commands.length === 0) {
      this.container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">💻</div>
          <p class="empty-state-text">${this.searchKeyword ? '没有找到匹配的指令' : '暂无指令'}</p>
          ${!this.searchKeyword ? `
          <div style="font-size: 13px; color: var(--text-tertiary); margin-top: 12px; line-height: 1.6; max-width: 280px;">
            <p style="margin-bottom: 8px;"><strong style="color: var(--text-secondary);">功能说明:</strong></p>
            <p style="margin-bottom: 6px;">• 保存常用命令,一键复制使用</p>
            <p style="margin-bottom: 6px;">• 终端风格图标展示</p>
            <p style="margin-bottom: 12px;">• 支持智能搜索过滤</p>
            <p style="margin-bottom: 6px;"><strong style="color: var(--text-secondary);">使用方式:</strong></p>
            <p>点击右上角 + 号添加,点击指令卡片即可复制</p>
          </div>
          ` : ''}
        </div>
      `;
      return;
    }

    // 单行显示: 图标 + 代码内容
    this.container.innerHTML = commands.map(cmd => `
      <div class="cmd-item" data-id="${cmd.id}">
        <div class="cmd-item-content">
          <svg class="cmd-item-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="4 17 10 11 4 5"></polyline>
            <line x1="12" y1="19" x2="20" y2="19"></line>
          </svg>
          <span class="cmd-item-code">${this.escapeHtml(this.truncate(cmd.code, 50))}</span>
        </div>
        <button class="btn btn-icon btn-delete btn-sm cmd-delete" data-id="${cmd.id}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
          </svg>
        </button>
      </div>
    `).join('');

    // 绑定点击复制事件
    this.container.querySelectorAll('.cmd-item').forEach(item => {
      item.addEventListener('click', async (e) => {
        if (e.target.closest('.cmd-delete')) return;
        const id = item.dataset.id;
        const commands = await Storage.getCommands();
        const cmd = commands.find(c => c.id === id);
        if (cmd) {
          await this.copyToClipboard(cmd.code);
          Toast.show('已复制到剪贴板', 'success');
        }
      });
    });

    // 绑定删除事件
    this.container.querySelectorAll('.cmd-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        await Storage.removeCommand(id);
        this.render();
        Toast.show('已删除指令');
      });
    });
  },

  showModal() {
    document.getElementById('cmd-title').value = '';
    document.getElementById('cmd-code').value = '';
    this.modal.classList.add('show');
    document.getElementById('cmd-title').focus();
  },

  hideModal() {
    this.modal.classList.remove('show');
  },

  async saveCommand() {
    const title = document.getElementById('cmd-title').value.trim();
    const code = document.getElementById('cmd-code').value.trim();

    if (!title || !code) {
      Toast.show('请填写完整信息', 'error');
      return;
    }

    await Storage.addCommand({ title, code });
    this.hideModal();
    this.render();
    Toast.show('已添加指令');
  },

  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // 降级方案
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  },

  truncate(str, len) {
    return str.length > len ? str.slice(0, len) + '...' : str;
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  // 供 AI 助理调用
  async addByAI(data) {
    const cmd = await Storage.addCommand(data);
    this.render();
    return cmd;
  }
};

window.Command = Command;

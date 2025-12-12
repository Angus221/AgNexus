/**
 * AG Nexus - 提示词模块
 */

const Prompt = {
  container: null,
  modal: null,
  searchInput: null,
  searchKeyword: '',
  editingId: null,

  init() {
    this.container = document.getElementById('prompt-list');
    this.modal = document.getElementById('prompt-modal');
    this.searchInput = document.getElementById('prompt-search');
    this.bindEvents();
    this.render();
  },

  bindEvents() {
    // 添加按钮
    document.getElementById('prompt-add')?.addEventListener('click', () => {
      this.showModal();
    });

    // 模态框关闭
    this.modal?.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', () => this.hideModal());
    });

    // 保存提示词
    document.getElementById('prompt-save')?.addEventListener('click', () => {
      this.savePrompt();
    });

    // 删除提示词
    document.getElementById('prompt-delete')?.addEventListener('click', () => {
      this.deletePrompt();
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

    // 监听标签页切换事件，切换到提示词页面时刷新数据
    window.addEventListener('tabChange', (e) => {
      if (e.detail.tab === 'prompt') {
        this.render();
      }
    });
  },

  async render() {
    let prompts = await Storage.getPrompts();

    // 搜索过滤
    if (this.searchKeyword) {
      prompts = prompts.filter(p =>
        p.title.toLowerCase().includes(this.searchKeyword) ||
        p.content.toLowerCase().includes(this.searchKeyword) ||
        p.tags.some(tag => tag.toLowerCase().includes(this.searchKeyword))
      );
    }

    if (prompts.length === 0) {
      this.container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">💡</div>
          <p class="empty-state-text">${this.searchKeyword ? '没有找到匹配的提示词' : '暂无提示词'}</p>
          ${!this.searchKeyword ? `
          <div style="font-size: 13px; color: var(--text-tertiary); margin-top: 12px; line-height: 1.6; max-width: 280px;">
            <p style="margin-bottom: 8px;"><strong style="color: var(--text-secondary);">功能说明:</strong></p>
            <p style="margin-bottom: 6px;">• 保存AI提示词模板</p>
            <p style="margin-bottom: 6px;">• 支持标签分类管理</p>
            <p style="margin-bottom: 12px;">• 快速复制使用,支持长文本编辑</p>
            <p style="margin-bottom: 6px;"><strong style="color: var(--text-secondary);">使用方式:</strong></p>
            <p>点击右上角 + 号添加,点击卡片查看详情,复制按钮快速使用</p>
          </div>
          ` : ''}
        </div>
      `;
      return;
    }

    this.container.innerHTML = prompts.map(prompt => `
      <div class="card card-clickable prompt-card" data-id="${prompt.id}" style="margin-bottom: 8px; padding: 10px 12px;">
        <div class="card-header" style="margin-bottom: 0;">
          <span class="card-title">${this.escapeHtml(prompt.title)}</span>
          <button class="btn btn-icon btn-ghost btn-sm prompt-copy" data-id="${prompt.id}" title="复制">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </button>
        </div>
        ${prompt.tags.length > 0 ? `<div class="card-footer" style="margin-top: 6px;">${prompt.tags.map(tag => `<span class="tag">#${this.escapeHtml(tag)}</span>`).join('')}</div>` : ''}
      </div>
    `).join('');

    // 绑定复制事件
    this.container.querySelectorAll('.prompt-copy').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const prompts = await Storage.getPrompts();
        const prompt = prompts.find(p => p.id === id);
        if (prompt) {
          await this.copyToClipboard(prompt.content);
          // 显示复制成功动画
          btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#107C10" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;
          setTimeout(() => {
            btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
          }, 800);
          Toast.show('已复制提示词', 'success');
        }
      });
    });

    // 绑定卡片点击编辑
    this.container.querySelectorAll('.prompt-card').forEach(card => {
      card.addEventListener('click', async (e) => {
        if (e.target.closest('.prompt-copy')) return;
        const id = card.dataset.id;
        this.showModal(id);
      });
    });
  },

  async showModal(editId = null) {
    this.editingId = editId;
    const titleEl = document.getElementById('prompt-modal-title');
    const titleInput = document.getElementById('prompt-title');
    const tagsInput = document.getElementById('prompt-tags');
    const contentInput = document.getElementById('prompt-content');
    const deleteBtn = document.getElementById('prompt-delete');

    if (editId) {
      titleEl.textContent = '编辑提示词';
      deleteBtn.style.display = 'block'; // 编辑模式下显示删除按钮
      const prompts = await Storage.getPrompts();
      const prompt = prompts.find(p => p.id === editId);
      if (prompt) {
        titleInput.value = prompt.title;
        tagsInput.value = prompt.tags.join(' ');
        contentInput.value = prompt.content;
      }
    } else {
      titleEl.textContent = '添加提示词';
      deleteBtn.style.display = 'none'; // 添加模式下隐藏删除按钮
      titleInput.value = '';
      tagsInput.value = '';
      contentInput.value = '';
    }

    this.modal.classList.add('show');
    titleInput.focus();
  },

  hideModal() {
    this.modal.classList.remove('show');
    this.editingId = null;
  },

  async savePrompt() {
    const title = document.getElementById('prompt-title').value.trim();
    const tagsStr = document.getElementById('prompt-tags').value.trim();
    const content = document.getElementById('prompt-content').value.trim();

    if (!title || !content) {
      Toast.show('请填写标题和内容', 'error');
      return;
    }

    const tags = tagsStr ? tagsStr.split(/\s+/).filter(t => t) : [];

    if (this.editingId) {
      await Storage.updatePrompt(this.editingId, { title, tags, content });
      Toast.show('已更新提示词');
    } else {
      await Storage.addPrompt({ title, tags, content });
      Toast.show('已添加提示词');
    }

    this.hideModal();
    this.render();
  },

  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
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

  // 删除提示词
  async deletePrompt() {
    if (!this.editingId) return;

    if (!confirm('确定要删除这个提示词吗?')) return;

    await Storage.removePrompt(this.editingId);
    this.hideModal();
    this.render();
    Toast.show('已删除提示词');
  },

  // 供 AI 助理调用
  async addByAI(data) {
    const prompt = await Storage.addPrompt(data);
    this.render();
    return prompt;
  }
};

window.Prompt = Prompt;

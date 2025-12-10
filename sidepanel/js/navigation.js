/**
 * AG Nexus - 导航模块
 */

const Navigation = {
  viewMode: 'grid', // grid 或 list
  container: null,
  modal: null,

  init() {
    this.container = document.getElementById('nav-list');
    this.modal = document.getElementById('nav-modal');
    this.bindEvents();
    this.render();
  },

  bindEvents() {
    // 视图切换
    document.getElementById('nav-view-grid')?.addEventListener('click', () => {
      this.setViewMode('grid');
    });
    document.getElementById('nav-view-list')?.addEventListener('click', () => {
      this.setViewMode('list');
    });

    // 添加按钮
    document.getElementById('nav-add')?.addEventListener('click', () => {
      this.showModal();
    });

    // 模态框关闭
    this.modal?.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', () => this.hideModal());
    });

    // 保存导航
    document.getElementById('nav-save')?.addEventListener('click', () => {
      this.saveNav();
    });

    // 点击遮罩关闭
    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal) this.hideModal();
    });
  },

  setViewMode(mode) {
    this.viewMode = mode;
    this.render();
  },

  async render() {
    const navs = await Storage.getNavs();

    if (navs.length === 0) {
      this.container.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <div class="empty-state-icon">🧭</div>
          <p class="empty-state-text">暂无导航</p>
          <div style="font-size: 13px; color: var(--text-tertiary); margin-top: 12px; line-height: 1.6; max-width: 280px;">
            <p style="margin-bottom: 8px;"><strong style="color: var(--text-secondary);">功能说明:</strong></p>
            <p style="margin-bottom: 6px;">• 快速访问常用网站,自动获取网站图标</p>
            <p style="margin-bottom: 6px;">• 支持4列网格优雅排列</p>
            <p style="margin-bottom: 12px;">• 可通过AI语音添加导航</p>
            <p style="margin-bottom: 6px;"><strong style="color: var(--text-secondary);">使用方式:</strong></p>
            <p>点击右上角 + 号手动添加,或对AI说"把百度加到导航"</p>
          </div>
        </div>
      `;
      return;
    }

    if (this.viewMode === 'grid') {
      this.container.className = 'nav-grid';
      this.container.innerHTML = navs.map(nav => `
        <div class="nav-card" data-id="${nav.id}" data-url="${nav.url}">
          <div class="nav-card-icon">
            <img src="${nav.favicon}" alt="" onerror="this.style.display='none'; this.parentElement.innerHTML='<span class=fallback-icon>🌐</span>';">
          </div>
          <span class="nav-card-title">${nav.title}</span>
        </div>
      `).join('');
    } else {
      this.container.className = 'nav-list';
      this.container.innerHTML = navs.map(nav => `
        <div class="list-item" data-id="${nav.id}" data-url="${nav.url}">
          <div class="list-item-icon">
            <img src="${nav.favicon}" alt="" onerror="this.style.display='none'; this.parentElement.innerHTML='🌐';">
          </div>
          <div class="list-item-content">
            <div class="list-item-title">${nav.title}</div>
            <div class="list-item-subtitle">${new URL(nav.url).hostname}</div>
          </div>
          <button class="btn btn-icon btn-ghost list-item-action nav-delete" data-id="${nav.id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
          </button>
        </div>
      `).join('');
    }

    // 绑定点击事件
    this.container.querySelectorAll('[data-url]').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.nav-delete')) return;
        const url = item.dataset.url;
        window.open(url, '_blank');
      });
    });

    // 绑定删除事件
    this.container.querySelectorAll('.nav-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        await Storage.removeNav(id);
        this.render();
        Toast.show('已删除导航');
      });
    });
  },

  showModal() {
    document.getElementById('nav-title').value = '';
    document.getElementById('nav-url').value = '';
    this.modal.classList.add('show');
    document.getElementById('nav-title').focus();
  },

  hideModal() {
    this.modal.classList.remove('show');
  },

  async saveNav() {
    const title = document.getElementById('nav-title').value.trim();
    const url = document.getElementById('nav-url').value.trim();

    if (!title || !url) {
      Toast.show('请填写完整信息', 'error');
      return;
    }

    // 自动补全 https
    let finalUrl = url;
    if (!/^https?:\/\//i.test(url)) {
      finalUrl = 'https://' + url;
    }

    try {
      new URL(finalUrl); // 验证 URL 格式
    } catch {
      Toast.show('网址格式不正确', 'error');
      return;
    }

    await Storage.addNav({ title, url: finalUrl });
    this.hideModal();
    this.render();
    Toast.show('已添加导航');
  },

  // 供 AI 助理调用
  async addByAI(data) {
    const nav = await Storage.addNav(data);
    this.render();
    return nav;
  }
};

window.Navigation = Navigation;

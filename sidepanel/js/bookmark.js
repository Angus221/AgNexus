/**
 * AG Nexus - 收藏模块
 */

const Bookmark = {
  container: null,
  modal: null,
  pagination: null,
  searchInput: null,
  currentPage: 1,
  pageSize: 5,
  searchKeyword: '',

  init() {
    this.container = document.getElementById('bookmark-list');
    this.modal = document.getElementById('bookmark-modal');
    this.pagination = document.getElementById('bookmark-pagination');
    this.searchInput = document.getElementById('bookmark-search');
    this.bindEvents();
    this.render();
  },

  bindEvents() {
    // 添加按钮
    document.getElementById('bookmark-add')?.addEventListener('click', () => {
      this.showModal();
    });

    // 模态框关闭
    this.modal?.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', () => this.hideModal());
    });

    // 保存收藏
    document.getElementById('bookmark-save')?.addEventListener('click', () => {
      this.saveBookmark();
    });

    // 点击遮罩关闭
    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal) this.hideModal();
    });

    // 搜索
    this.searchInput?.addEventListener('input', (e) => {
      this.searchKeyword = e.target.value.trim().toLowerCase();
      this.currentPage = 1;
      this.render();
    });
  },

  async render() {
    let bookmarks = await Storage.getBookmarks();

    // 搜索过滤
    if (this.searchKeyword) {
      bookmarks = bookmarks.filter(b =>
        b.title.toLowerCase().includes(this.searchKeyword) ||
        b.url.toLowerCase().includes(this.searchKeyword) ||
        (b.description && b.description.toLowerCase().includes(this.searchKeyword))
      );
    }

    if (bookmarks.length === 0) {
      this.container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📑</div>
          <p class="empty-state-text">${this.searchKeyword ? '没有找到匹配的收藏' : '暂无收藏'}</p>
          ${!this.searchKeyword ? `
          <div style="font-size: 13px; color: var(--text-tertiary); margin-top: 12px; line-height: 1.6; max-width: 280px;">
            <p style="margin-bottom: 8px;"><strong style="color: var(--text-secondary);">功能说明:</strong></p>
            <p style="margin-bottom: 6px;">• 收藏优质文章和资源</p>
            <p style="margin-bottom: 6px;">• 支持关键字搜索和分页展示</p>
            <p style="margin-bottom: 12px;">• 自动提取页面标题</p>
            <p style="margin-bottom: 6px;"><strong style="color: var(--text-secondary);">使用方式:</strong></p>
            <p>点击右上角 + 号手动添加,或对AI说"收藏当前网页"</p>
          </div>
          ` : ''}
        </div>
      `;
      this.pagination.innerHTML = '';
      return;
    }

    // 分页
    const totalPages = Math.ceil(bookmarks.length / this.pageSize);
    const start = (this.currentPage - 1) * this.pageSize;
    const pageBookmarks = bookmarks.slice(start, start + this.pageSize);

    this.container.innerHTML = pageBookmarks.map(b => `
      <div class="bookmark-item" data-id="${b.id}" data-url="${b.url}">
        <div class="bookmark-item-content">
          <div class="bookmark-item-title">${this.escapeHtml(b.title)}</div>
        </div>
        <div class="bookmark-item-actions">
          <button class="btn btn-icon btn-delete btn-sm bookmark-delete" data-id="${b.id}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    `).join('');

    // 渲染分页
    if (totalPages > 1) {
      this.pagination.innerHTML = `
        <button class="pagination-btn" ${this.currentPage === 1 ? 'disabled' : ''} data-page="${this.currentPage - 1}">上一页</button>
        <span class="pagination-info">${this.currentPage} / ${totalPages}</span>
        <button class="pagination-btn" ${this.currentPage === totalPages ? 'disabled' : ''} data-page="${this.currentPage + 1}">下一页</button>
      `;

      this.pagination.querySelectorAll('.pagination-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const page = parseInt(btn.dataset.page);
          if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.render();
          }
        });
      });
    } else {
      this.pagination.innerHTML = '';
    }

    // 绑定点击事件
    this.container.querySelectorAll('.bookmark-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.bookmark-delete')) return;
        const url = item.dataset.url;
        window.open(url, '_blank');
      });
    });

    // 绑定删除事件
    this.container.querySelectorAll('.bookmark-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        await Storage.removeBookmark(id);
        this.render();
        Toast.show('已删除收藏');
      });
    });
  },

  showModal() {
    document.getElementById('bookmark-title').value = '';
    document.getElementById('bookmark-url').value = '';
    document.getElementById('bookmark-desc').value = '';
    this.modal.classList.add('show');
    document.getElementById('bookmark-title').focus();
  },

  hideModal() {
    this.modal.classList.remove('show');
  },

  async saveBookmark() {
    const title = document.getElementById('bookmark-title').value.trim();
    const url = document.getElementById('bookmark-url').value.trim();
    const description = document.getElementById('bookmark-desc').value.trim();

    if (!title || !url) {
      Toast.show('请填写标题和网址', 'error');
      return;
    }

    let finalUrl = url;
    if (!/^https?:\/\//i.test(url)) {
      finalUrl = 'https://' + url;
    }

    try {
      new URL(finalUrl);
    } catch {
      Toast.show('网址格式不正确', 'error');
      return;
    }

    await Storage.addBookmark({ title, url: finalUrl, description });
    this.hideModal();
    this.currentPage = 1;
    this.render();
    Toast.show('已添加收藏');
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};

window.Bookmark = Bookmark;

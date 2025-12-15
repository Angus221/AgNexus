/**
 * AG Nexus - 密码管理器模块
 * 管理账户密码和 API 密钥
 */

const Vault = {
  masterPinHash: null, // 主密码哈希
  currentEditId: null,
  isUnlocked: false,

  init() {
    this.bindEvents();
    this.checkMasterPin();

    // 监听标签切换，切换到 vault 页面时检查是否已验证
    window.addEventListener('tabChange', (e) => {
      if (e.detail.tab === 'vault') {
        // 如果已经解锁，渲染列表；否则显示锁定提示
        if (this.isUnlocked) {
          this.renderVaultPage();
        } else {
          this.showLockedHint();
        }
      }
    });
  },

  // 显示锁定提示
  showLockedHint() {
    document.getElementById('vault-locked-hint').style.display = 'block';
    document.getElementById('vault-panel-add').style.display = 'none';
    document.getElementById('vault-form-container').style.display = 'none';
    document.getElementById('vault-panel-list').innerHTML = '';
  },

  bindEvents() {
    // 打开更多菜单
    document.getElementById('btn-more')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const menu = document.getElementById('more-menu');
      menu.classList.toggle('show');
    });

    // 点击其他地方关闭菜单
    document.addEventListener('click', () => {
      const menu = document.getElementById('more-menu');
      if (menu.classList.contains('show')) {
        menu.classList.remove('show');
      }
    });

    // 菜单项 - 账户密钥
    document.getElementById('menu-vault')?.addEventListener('click', () => {
      document.getElementById('more-menu').classList.remove('show');
      this.openVault();
    });

    // 菜单项 - 设置
    document.getElementById('menu-settings')?.addEventListener('click', () => {
      document.getElementById('more-menu').classList.remove('show');
      Tabs.switchTab('settings');
    });

    // 设置主密码
    document.getElementById('vault-setup-save')?.addEventListener('click', () => {
      this.setupMasterPin();
    });

    // 验证主密码
    document.getElementById('vault-verify-submit')?.addEventListener('click', () => {
      this.verifyMasterPin();
    });
    document.getElementById('vault-verify-cancel')?.addEventListener('click', () => {
      this.hideModal('vault-verify-modal');
    });
    document.getElementById('vault-verify-close')?.addEventListener('click', () => {
      this.hideModal('vault-verify-modal');
    });

    // 设置主密码时回车提交
    document.getElementById('vault-setup-pin-confirm')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.setupMasterPin();
    });

    // 验证主密码时回车提交
    document.getElementById('vault-verify-pin')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.verifyMasterPin();
    });

    // 页面内添加账户按钮
    document.getElementById('vault-panel-add')?.addEventListener('click', () => {
      this.showAddForm();
    });

    // 类型切换
    document.addEventListener('change', (e) => {
      if (e.target.name === 'vault-item-type') {
        this.updateFormFields();
      }
    });

    // 保存账户
    document.getElementById('vault-item-save')?.addEventListener('click', () => {
      this.saveItem();
    });

    // 取消按钮
    document.getElementById('vault-item-cancel')?.addEventListener('click', () => {
      this.hideAddForm();
    });
  },

  // 检查是否设置了主密码
  async checkMasterPin() {
    const pin = await Storage.getVaultPin();
    if (!pin) {
      this.masterPinHash = null;
    } else {
      this.masterPinHash = pin;
    }
  },

  // 打开保险库
  async openVault() {
    await this.checkMasterPin();

    if (!this.masterPinHash) {
      // 首次使用，设置主密码
      this.showModal('vault-setup-modal');
    } else {
      // 需要验证主密码
      this.showModal('vault-verify-modal');
      document.getElementById('vault-verify-pin').value = '';
      document.getElementById('vault-verify-pin').focus();
    }
  },

  // 设置主密码
  async setupMasterPin() {
    const pin = document.getElementById('vault-setup-pin').value.trim();
    const pinConfirm = document.getElementById('vault-setup-pin-confirm').value.trim();

    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      Toast.show('请输入4位数字密码', 'error');
      return;
    }

    if (pin !== pinConfirm) {
      Toast.show('两次输入的密码不一致', 'error');
      return;
    }

    // 保存主密码（简单哈希）
    const hash = this.hashPin(pin);
    await Storage.setVaultPin(hash);
    this.masterPinHash = hash;

    Toast.show('主密码设置成功', 'success');
    this.hideModal('vault-setup-modal');

    // 清空输入
    document.getElementById('vault-setup-pin').value = '';
    document.getElementById('vault-setup-pin-confirm').value = '';

    // 直接切换到 vault 页面
    Tabs.switchTab('vault');
    this.renderVaultPage();
  },

  // 验证主密码
  async verifyMasterPin() {
    const pin = document.getElementById('vault-verify-pin').value.trim();

    if (!pin || pin.length !== 4) {
      Toast.show('请输入4位数字密码', 'error');
      return;
    }

    const hash = this.hashPin(pin);
    if (hash !== this.masterPinHash) {
      Toast.show('密码错误', 'error');
      document.getElementById('vault-verify-pin').value = '';
      return;
    }

    // 验证成功
    this.isUnlocked = true;
    this.hideModal('vault-verify-modal');

    // 切换到 vault 页面
    Tabs.switchTab('vault');
    this.renderVaultPage();
  },

  // 渲染账户页面
  async renderVaultPage() {
    // 隐藏锁定提示
    document.getElementById('vault-locked-hint').style.display = 'none';
    // 显示添加按钮
    document.getElementById('vault-panel-add').style.display = 'flex';
    // 渲染列表
    const items = await Storage.getVaultItems();
    this.renderItems(items);
  },

  // 渲染账户列表
  renderItems(items) {
    const container = document.getElementById('vault-panel-list');

    if (items.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 48px 16px; color: var(--text-secondary);">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 16px; opacity: 0.5;">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <div style="margin-bottom: 16px;">暂无账户密钥</div>
          <div style="font-size: 13px; color: var(--text-tertiary); line-height: 1.6; max-width: 280px; margin: 0 auto;">
            <p style="margin-bottom: 8px;"><strong style="color: var(--text-secondary);">功能说明:</strong></p>
            <p style="margin-bottom: 6px;">• 加密存储敏感信息,PIN码保护</p>
            <p style="margin-bottom: 6px;">• 支持密码和API密钥两种类型</p>
            <p style="margin-bottom: 12px;">• 一键复制功能,安全便捷</p>
            <p style="margin-bottom: 6px;"><strong style="color: var(--text-secondary);">使用方式:</strong></p>
            <p>点击上方按钮添加账户或API密钥</p>
          </div>
        </div>
      `;
      return;
    }

    const html = items.map(item => {
      const icon = item.type === 'apikey'
        ? '<path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/>'
        : '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>';

      const typeLabel = item.type === 'apikey' ? 'API Key' : '密码';

      // 解密并提取账户信息（仅用于显示）
      let accountInfo = '';
      if (item.type === 'password') {
        try {
          const decrypted = this.decrypt(item.value, this.masterPinHash);
          if (decrypted.includes('|||')) {
            const parts = decrypted.split('|||');
            accountInfo = `<div style="font-size: 12px; color: var(--text-tertiary); margin-top: 2px;">账户: ${this.escapeHtml(parts[0])}</div>`;
          }
        } catch (e) {
          // 解密失败，不显示账户信息
        }
      }

      const maskedValue = '*'.repeat(20);

      return `
        <div class="vault-item">
          <div class="vault-item-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              ${icon}
            </svg>
          </div>
          <div class="vault-item-content">
            <div class="vault-item-name">${this.escapeHtml(item.name)}</div>
            <div class="vault-item-meta">
              <span class="vault-item-type">${typeLabel}</span>
              <span class="vault-item-value">${maskedValue}</span>
            </div>
            ${accountInfo}
            ${item.note ? `<div class="vault-item-note">${this.escapeHtml(item.note)}</div>` : ''}
          </div>
          <div class="vault-item-actions">
            <button class="btn btn-icon btn-ghost vault-copy-btn" data-id="${item.id}" title="复制">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
              </svg>
            </button>
            <button class="btn btn-icon btn-ghost vault-edit-btn" data-id="${item.id}" title="编辑">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
              </svg>
            </button>
            <button class="btn btn-icon btn-ghost btn-danger vault-delete-btn" data-id="${item.id}" title="删除">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = html;

    // 绑定事件 - 使用事件委托
    container.querySelectorAll('.vault-copy-btn').forEach(btn => {
      btn.addEventListener('click', () => this.copyItem(btn.dataset.id));
    });
    container.querySelectorAll('.vault-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => this.editItem(btn.dataset.id));
    });
    container.querySelectorAll('.vault-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => this.deleteItem(btn.dataset.id));
    });
  },

  // 显示添加表单
  showAddForm() {
    this.currentEditId = null;
    document.getElementById('vault-form-title').textContent = '添加账户';
    document.getElementById('vault-item-name').value = '';
    document.getElementById('vault-item-account').value = '';
    document.getElementById('vault-item-value').value = '';
    document.getElementById('vault-item-note').value = '';
    document.querySelector('input[name="vault-item-type"][value="password"]').checked = true;
    this.updateFormFields();
    document.getElementById('vault-form-container').style.display = 'block';
  },

  // 隐藏添加表单
  hideAddForm() {
    document.getElementById('vault-form-container').style.display = 'none';
  },

  // 更新表单字段显示
  updateFormFields() {
    const type = document.querySelector('input[name="vault-item-type"]:checked')?.value;
    const accountField = document.getElementById('vault-field-account');
    const valueLabel = document.getElementById('vault-field-value-label');
    const valueInput = document.getElementById('vault-item-value');

    if (type === 'password') {
      // 密码类型：显示账户字段
      accountField.style.display = 'block';
      valueLabel.textContent = '密码';
      valueInput.placeholder = '输入密码';
    } else {
      // API Key 类型：隐藏账户字段
      accountField.style.display = 'none';
      valueLabel.textContent = 'API Key';
      valueInput.placeholder = '输入 API Key';
    }
  },

  // 编辑账户
  async editItem(id) {
    const items = await Storage.getVaultItems();
    const item = items.find(i => i.id === id);
    if (!item) return;

    this.currentEditId = id;

    // 解密内容
    const decryptedValue = this.decrypt(item.value, this.masterPinHash);

    // 如果是密码类型，尝试分割账户和密码（格式：账户|||密码）
    let account = '';
    let value = decryptedValue;
    if (item.type === 'password' && decryptedValue.includes('|||')) {
      const parts = decryptedValue.split('|||');
      account = parts[0];
      value = parts[1];
    }

    document.getElementById('vault-form-title').textContent = '编辑账户';
    document.getElementById('vault-item-name').value = item.name;
    document.getElementById('vault-item-account').value = account;
    document.getElementById('vault-item-value').value = value;
    document.getElementById('vault-item-note').value = item.note || '';
    document.querySelector(`input[name="vault-item-type"][value="${item.type}"]`).checked = true;
    this.updateFormFields();
    document.getElementById('vault-form-container').style.display = 'block';
  },

  // 保存账户
  async saveItem() {
    const name = document.getElementById('vault-item-name').value.trim();
    const account = document.getElementById('vault-item-account').value.trim();
    const value = document.getElementById('vault-item-value').value.trim();
    const note = document.getElementById('vault-item-note').value.trim();
    const type = document.querySelector('input[name="vault-item-type"]:checked').value;

    if (!name) {
      Toast.show('请输入名称', 'error');
      return;
    }

    if (type === 'password' && !account) {
      Toast.show('请输入账户', 'error');
      return;
    }

    if (!value) {
      Toast.show(type === 'password' ? '请输入密码' : '请输入API Key', 'error');
      return;
    }

    // 组合内容：密码类型包含账户信息，API Key 只有密钥
    let fullValue = value;
    if (type === 'password' && account) {
      fullValue = `${account}|||${value}`;
    }

    // 加密内容
    const encrypted = this.encrypt(fullValue, this.masterPinHash);

    const data = {
      name,
      value: encrypted,
      type,
      note
    };

    if (this.currentEditId) {
      // 更新
      await Storage.updateVaultItem(this.currentEditId, data);
      Toast.show('账户已更新', 'success');
    } else {
      // 添加
      await Storage.addVaultItem(data);
      Toast.show('账户已添加', 'success');
    }

    this.hideAddForm();
    this.renderVaultPage();
  },

  // 复制账户内容
  async copyItem(id) {
    const items = await Storage.getVaultItems();
    const item = items.find(i => i.id === id);
    if (!item) return;

    // 解密内容
    const decryptedValue = this.decrypt(item.value, this.masterPinHash);

    // 如果是密码类型，组合账户和密码信息
    let copyText = decryptedValue;
    if (item.type === 'password' && decryptedValue.includes('|||')) {
      const parts = decryptedValue.split('|||');
      copyText = `账户: ${parts[0]}\n密码: ${parts[1]}`;
    }

    // 复制到剪贴板
    try {
      await navigator.clipboard.writeText(copyText);
      Toast.show('已复制到剪贴板', 'success');
    } catch (e) {
      Toast.show('复制失败', 'error');
    }
  },

  // 删除账户
  async deleteItem(id) {
    if (!confirm('确定要删除这个账户吗？')) return;

    await Storage.removeVaultItem(id);
    Toast.show('账户已删除', 'success');
    this.renderVaultPage();
  },

  // 简单的密码哈希
  hashPin(pin) {
    let hash = 0;
    for (let i = 0; i < pin.length; i++) {
      hash = ((hash << 5) - hash) + pin.charCodeAt(i);
      hash = hash & hash;
    }
    return hash.toString();
  },

  // 简单的加密（XOR）
  encrypt(text, key) {
    const keyStr = key.toString();
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ keyStr.charCodeAt(i % keyStr.length));
    }
    return btoa(result); // Base64编码
  },

  // 简单的解密
  decrypt(encrypted, key) {
    const keyStr = key.toString();
    const text = atob(encrypted); // Base64解码
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ keyStr.charCodeAt(i % keyStr.length));
    }
    return result;
  },

  // HTML 转义
  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  // 显示模态框
  showModal(id) {
    document.getElementById(id)?.classList.add('show');
  },

  // 隐藏模态框
  hideModal(id) {
    document.getElementById(id)?.classList.remove('show');
  }
};

window.Vault = Vault;

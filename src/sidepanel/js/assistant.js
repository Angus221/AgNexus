/**
 * AG Nexus - AI 助理模块 (LangChain 版本)
 */

import { AGNexusAgent } from './agent/agent.js';

const Assistant = {
  container: null,
  input: null,
  sendBtn: null,
  isLoading: false,
  agent: null, // LangChain Agent 实例

  async init() {
    console.log('Assistant 初始化中...');

    this.container = document.getElementById('chat-messages');
    this.input = document.getElementById('chat-input');
    this.sendBtn = document.getElementById('chat-send');

    // 初始化 LangChain Agent
    this.agent = new AGNexusAgent();

    this.bindEvents();
    await this.loadHistory();

    console.log('Assistant 初始化完成');
  },

  bindEvents() {
    // 输入框事件
    this.input?.addEventListener('input', () => {
      const hasContent = this.input.value.trim().length > 0;
      this.sendBtn.style.display = hasContent ? 'flex' : 'none';
    });

    this.input?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // 发送按钮
    this.sendBtn?.addEventListener('click', () => {
      this.sendMessage();
    });

    // 清除聊天记录按钮
    document.getElementById('chat-clear')?.addEventListener('click', async () => {
      if (!confirm('确定要清除所有聊天记录吗？')) return;

      try {
        await this.agent.clearHistory();
        this.container.innerHTML = '';
        await this.loadHistory();
        Toast.show('聊天记录已清除');
      } catch (error) {
        console.error('清除聊天记录失败:', error);
        Toast.show('清除失败', 'error');
      }
    });
  },

  async loadHistory() {
    const history = await Storage.getChatHistory();
    const settings = await Storage.getSettings();

    if (!settings.apiKey) {
      this.addMessage('assistant', '⚠️ 请先在设置中配置 API Key', false);
      return;
    }

    if (history.length === 0) {
      this.addMessage('assistant', '你好！我是 AG Nexus 助理，你可以叫我小G 😊\n\n我可以帮你：\n• 管理待办事项\n• 添加快捷导航\n• 收藏网页\n• 管理提示词和指令\n\n有什么需要帮忙的吗？', false);
    } else {
      // 渲染历史消息
      for (const msg of history) {
        this.renderMessage(msg.role, msg.content, false);
      }
      this.scrollToBottom();
    }
  },

  async sendMessage() {
    const text = this.input.value.trim();
    if (!text || this.isLoading) return;

    // 清空输入框
    this.input.value = '';
    this.sendBtn.style.display = 'none';

    // 显示用户消息
    this.renderMessage('user', text, true);
    this.scrollToBottom();

    // 显示加载状态
    this.isLoading = true;
    const loadingEl = this.showLoading();

    try {
      // 调用 LangChain Agent
      const result = await this.agent.chat(text);

      loadingEl.remove();

      if (result.success) {
        this.addMessage('assistant', result.content);

        // 如果有工具调用，显示工具结果
        if (result.toolCalls && result.toolCalls.length > 0) {
          console.log('工具调用:', result.toolCalls);
        }
      } else {
        this.addMessage('assistant', `❌ 抱歉，发生错误：${result.error}\n\n请检查 API 配置是否正确。`);
      }
    } catch (error) {
      loadingEl.remove();
      console.error('发送消息失败:', error);
      this.addMessage('assistant', `❌ 抱歉，发生错误：${error.message}`);
    } finally {
      this.isLoading = false;
    }
  },

  async addMessage(role, content) {
    this.renderMessage(role, content, true);
    this.scrollToBottom();
  },

  renderMessage(role, content, animate = false) {
    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${role}`;
    if (animate) {
      messageEl.style.animation = 'fadeIn 0.3s ease';
    }

    // 头像
    const avatarEl = document.createElement('div');
    avatarEl.className = 'chat-avatar';
    if (role === 'assistant') {
      avatarEl.innerHTML = '<img src="../icons/icon.jpg" alt="Assistant" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">';
    } else {
      avatarEl.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor" style="width: 32px; height: 32px;">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      `;
    }
    messageEl.appendChild(avatarEl);

    // 消息气泡
    const bubbleEl = document.createElement('div');
    bubbleEl.className = 'chat-bubble';
    bubbleEl.innerHTML = this.formatContent(content);
    messageEl.appendChild(bubbleEl);

    this.container.appendChild(messageEl);
  },

  formatContent(content) {
    // 基础 Markdown 格式化
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // 粗体
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // 斜体
      .replace(/`([^`]+)`/g, '<code>$1</code>') // 行内代码
      .replace(/^### (.*$)/gim, '<h3>$1</h3>') // h3
      .replace(/^## (.*$)/gim, '<h2>$1</h2>') // h2
      .replace(/^# (.*$)/gim, '<h1>$1</h1>') // h1
      .replace(/^• (.*$)/gim, '<li>$1</li>') // 列表项
      .replace(/\n/g, '<br>'); // 换行
  },

  showLoading() {
    const loadingEl = document.createElement('div');
    loadingEl.className = 'chat-message assistant';
    loadingEl.innerHTML = `
      <div class="chat-avatar">
        <img src="../icons/icon.jpg" alt="Assistant" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">
      </div>
      <div class="chat-bubble">
        <div class="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `;
    this.container.appendChild(loadingEl);
    this.scrollToBottom();
    return loadingEl;
  },

  scrollToBottom() {
    if (this.container) {
      this.container.scrollTop = this.container.scrollHeight;
    }
  },

  // 日期格式化辅助函数（保留用于可能的UI显示）
  getDateLabel(dateStr) {
    if (!dateStr) return '未设置';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const date = new Date(dateStr + 'T00:00:00');
    date.setHours(0, 0, 0, 0);

    const diff = Math.floor((date - today) / (1000 * 60 * 60 * 24));

    if (diff === 0) return '今天';
    if (diff === 1) return '明天';
    if (diff === -1) return '昨天';
    if (diff > 1 && diff <= 7) return `${diff}天后`;
    if (diff < -1 && diff >= -7) return `${Math.abs(diff)}天前`;

    return dateStr;
  }
};

window.Assistant = Assistant;

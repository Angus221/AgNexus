/**
 * AG Nexus - AI 助理模块
 */

const Assistant = {
  container: null,
  input: null,
  sendBtn: null,
  isLoading: false,

  // 生成动态系统提示词
  async generateSystemPrompt() {
    const now = new Date();
    const currentTime = now.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });

    // 获取用户信息和记忆
    const userProfile = await Storage.getUserProfile();
    const memoryBank = await Storage.getMemoryBank();

    // 获取未完成的待办
    const todos = await Storage.getTodos();
    const pendingTodos = todos.filter(t => !t.done);

    // 按优先级和日期排序
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    pendingTodos.sort((a, b) => {
      // 先按优先级
      const priorityDiff = (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
      if (priorityDiff !== 0) return priorityDiff;
      // 再按日期
      if (!a.startDate) return 1;
      if (!b.startDate) return -1;
      return a.startDate.localeCompare(b.startDate);
    });

    // 检查紧急待办(今天且有提醒的)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const urgentTodos = pendingTodos.filter(t => {
      if (!t.reminderEnabled || !t.reminderTime || !t.startDate) return false;
      if (t.startDate !== todayStr) return false;
      const reminderDateTime = new Date(`${t.startDate}T${t.reminderTime}:00`);
      return reminderDateTime > now; // 今天还未到提醒时间的
    });

    // 构建待办列表文本
    let todosText = '';
    if (pendingTodos.length > 0) {
      todosText = '\n\n## 当前未完成待办清单\n';
      pendingTodos.slice(0, 10).forEach((todo, index) => {
        const priorityEmoji = { high: '🔴', medium: '🟡', low: '🟢' }[todo.priority] || '⚪';
        const dateLabel = this.getDateLabel(todo.startDate);
        const timeInfo = todo.reminderEnabled && todo.reminderTime ? ` ⏰${todo.reminderTime}` : '';
        todosText += `${index + 1}. ${priorityEmoji} ${todo.text} - ${dateLabel}${timeInfo}\n`;
      });
      if (pendingTodos.length > 10) {
        todosText += `\n...还有 ${pendingTodos.length - 10} 个待办未显示`;
      }
    }

    // 紧急提醒
    let urgentAlert = '';
    if (urgentTodos.length > 0) {
      urgentAlert = '\n\n⚠️ **重要提醒**：用户今天有 ' + urgentTodos.length + ' 个待办需要处理！请主动提醒用户关注。';
    }

    // 构建用户信息文本
    let userInfo = '';
    if (userProfile) {
      const genderText = userProfile.gender === 'male' ? '他' : userProfile.gender === 'female' ? '她' : 'TA';
      userInfo = `\n\n## 用户信息\n称呼：${userProfile.name}\n性别：${genderText}`;
    }

    // 构建记忆库文本
    let memoryText = '';
    if (memoryBank) {
      memoryText = `\n\n## 记忆库\n以下是你关于用户的记忆（仅包含用户行为和偏好相关的信息）：\n${memoryBank}`;
    }

    return `你是一个智能的浏览器侧边栏助手 AG Nexus，也叫小G，回复语气简短，扮演25岁俏皮女孩的回复语气。

## 当前时间
${currentTime}${userInfo}${memoryText}
${todosText}${urgentAlert}

## 你的职责
1. **待办管理助手**
   - 帮助用户梳理待办事项的优先级
   - 主动提醒用户今天需要处理的紧急待办
   - 当用户添加待办时，协助分析优先级，给出合理建议
   - 如果发现用户待办过多或冲突，主动提出优化建议
   - 如果用户闲聊，适当的时候用用户的昵称称呼对方，语气俏皮可爱~。

2. **数据操作助手**
   - 当用户需要"添加、创建、记录"时，通过 JSON 指令操作数据
   - 支持添加导航、收藏、待办、提示词、指令

## JSON 工具指令格式
当用户意图涉及"添加、创建、记录"时，必须输出对应的 JSON 块：

1. 添加导航（带图标，显示在顶部）: \`\`\`json
{"tool": "add_nav", "data": {"title": "名称", "url": "网址"}}
\`\`\`
   - 用于常用网站的快捷入口
   - title 可以留空 ""，系统会自动提取一级域名作为名称
   - 例如：用户说"把百度加到导航" → {"tool": "add_nav", "data": {"title": "", "url": "https://www.baidu.com"}}

2. 添加收藏（显示在下方）: \`\`\`json
{"tool": "add_bookmark", "data": {"title": "名称", "url": "网址", "description": "描述"}}
\`\`\`
   - 用于收藏具体的文章、页面
   - title 用户没说可以留空 ""，系统会自动提取URL最后一级路径作为名称
   - description 是可选的
   - 例如：用户说"收藏当前网页" → {"tool": "add_bookmark", "data": {"title": "", "url": "{{current_tab}}"}}

当前网页标识：
   - 如果用户说"当前网页"、"这个页面"、"当前页面"等，使用 "{{current_tab}}" 作为 url 或 title
   - 例如："收藏当前网页" → {"tool": "add_bookmark", "data": {"title": "{{current_tab}}", "url": "{{current_tab}}"}}
   - 例如："把当前页面加到导航" → {"tool": "add_nav", "data": {"title": "{{current_tab}}", "url": "{{current_tab}}"}}

3. 添加待办: \`\`\`json
{"tool": "add_todo", "data": {
  "text": "任务内容",
  "dateType": "today",  // today/tomorrow/thisweek/other
  "startDate": "2025-12-10",  // YYYY-MM-DD
  "reminderEnabled": true,  // 是否开启提醒
  "reminderTime": "18:00",  // HH:mm
  "priority": "high"  // low/medium/high
}}
\`\`\`

4. 添加提示词: \`\`\`json
{"tool": "add_prompt", "data": {"title": "标题", "content": "内容", "tags": ["标签"]}}
\`\`\`

5. 添加指令: \`\`\`json
{"tool": "add_cmd", "data": {"title": "名称", "code": "指令内容"}}
\`\`\`

## 注意事项
- 添加待办时，根据用户描述智能判断优先级（紧急且重要=high，重要=medium，一般=low）
- 如果用户没说具体时间，默认today，提醒时间18:00
- 用中文友好地回复用户
- 主动关注用户的待办健康度，适时给出管理建议
- 优化用户的待办描述，比如用户说“明天上午11点，我要开项目周会”，你要总结成“11点参加项目周会”

## 重要规则
- **每次用户请求操作时，都必须执行对应的工具指令**，不要因为历史记录中有类似操作就跳过
- 即使历史中有"收藏了某个网页"，如果用户再次说"收藏当前网页"，你仍然要返回 add_bookmark 工具指令
- 不要假设用户的操作已经完成，每次都要执行`;
  },

  getDateLabel(startDate) {
    if (!startDate) return '未设置日期';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(startDate);
    date.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((date - today) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '明天';
    if (diffDays < 0) return '已过期';
    if (diffDays <= 7) {
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      return weekDays[date.getDay()];
    }
    return startDate.slice(5); // MM-DD
  },

  init() {
    this.container = document.getElementById('chat-messages');
    this.input = document.getElementById('chat-input');
    this.sendBtn = document.getElementById('chat-send');
    this.bindEvents();
    this.loadHistory();
  },

  bindEvents() {
    // 监听标签切换事件，切换到助手时滚动到底部
    window.addEventListener('tabChange', (e) => {
      if (e.detail.tab === 'assistant') {
        // 使用 setTimeout 确保面板已经显示
        setTimeout(() => {
          this.scrollToBottom();
        }, 100);
      }
    });

    // 输入框事件
    this.input?.addEventListener('input', () => {
      this.sendBtn.style.display = this.input.value.trim() ? 'flex' : 'none';
    });

    this.input?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // 粘贴支持 - 特别为 Mac 添加明确的粘贴处理
    this.input?.addEventListener('paste', (e) => {
      console.log('粘贴事件触发');
      // 不阻止默认行为，让浏览器正常处理粘贴
      // 只是记录日志用于调试
    });

    // 发送按钮
    this.sendBtn?.addEventListener('click', () => {
      this.sendMessage();
    });

    // 清除聊天记录按钮
    document.getElementById('chat-clear')?.addEventListener('click', () => {
      this.clearHistory();
    });
  },

  async loadHistory() {
    const history = await Storage.getChatHistory();
    const settings = await Storage.getSettings();
    const hasAskedUserInfo = await Storage.getHasAskedUserInfo();

    // 第一步：检查是否配置了API
    if (!settings.apiKey) {
      this.addMessage('assistant', '你好！我是AG Nexus 助理，你可以叫我小G，。\n\n在开始使用前，请点击右上角"..."，设置你的 API Key。\n\n目前支持 OpenAI 风格的接口，默认是阿里百炼平台。');
      return;
    }

    // 第二步：检查是否首次对话（只询问一次）
    if (!hasAskedUserInfo) {
      this.addMessage('assistant', '你好！我是AG Nexus 助理，你可以叫我小G，✨\n\n那我要怎么称呼你呀~，你是小哥哥还是小姐姐呀，好想认识一下你呀~不想告诉和我说跳过也行~');
      return;
    }

    // 第三步：正常显示欢迎消息或历史
    const userProfile = await Storage.getUserProfile();

    if (history.length === 0) {
      // 显示欢迎消息
      let greeting = '！';
      if (userProfile) {
        const title = ' ';
        greeting = `${userProfile.name}${title}！`;
      }
      this.addMessage('assistant', `你好${greeting}我是AG Nexus 助理，你可以叫我小G，。\n\n我可以帮你：\n• 添加快捷导航\n• 管理指令和提示词\n• 创建待办事项\n\n例如："帮我把当前页面加到导航 或收藏"、"记个事，明天下午2点开会"、"收藏当前网页"`);
    } else {
      // 恢复历史消息
      for (const msg of history) {
        this.renderMessage(msg.role, msg.content, false);
      }
      this.scrollToBottom();
    }
  },

  async sendMessage() {
    const text = this.input.value.trim();
    if (!text || this.isLoading) return;

    // 检查 API 配置
    const settings = await Storage.getSettings();
    if (!settings.apiKey) {
      // 显示用户消息
      this.addMessage('user', text);
      this.input.value = '';
      this.sendBtn.style.display = 'none';

      // AI回复提示配置API密钥
      this.addMessage('assistant', '请点击右上角"..."，设置你的 API Key。\n\n目前支持 OpenAI 风格的接口，默认是阿里百炼平台。');
      return;
    }

    // 检查是否首次对话，需要收集用户信息
    const hasAskedUserInfo = await Storage.getHasAskedUserInfo();
    if (!hasAskedUserInfo) {
      await this.handleFirstTimeSetup(text);
      return;
    }

    // 清空输入框
    this.input.value = '';
    this.sendBtn.style.display = 'none';

    // 显示用户消息（先不保存到历史）
    this.renderMessage('user', text, true);
    this.scrollToBottom();

    // 显示加载状态
    this.isLoading = true;
    const loadingEl = this.showLoading();

    try {
      // 获取历史消息
      const history = await Storage.getChatHistory();
      // 生成动态系统提示词
      const systemPrompt = await this.generateSystemPrompt();
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-10).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: text }
      ];

      // 调用 API
      const response = await this.callAPI(settings, messages);

      // 移除加载状态
      loadingEl.remove();

      // 解析并执行工具调用
      const { cleanContent, toolResults } = await this.parseAndExecuteTools(response);

      // 判断是否是纯工具操作
      const isPureToolCall = !cleanContent && toolResults.length > 0;

      // 保存用户消息到历史（如果不是纯工具操作）
      if (!isPureToolCall) {
        await Storage.addChatMessage({ role: 'user', content: text });
      }

      // 显示并保存 AI 回复
      if (cleanContent || toolResults.length > 0) {
        const aiContent = cleanContent || '操作已完成';
        // 只有在不是纯工具操作时才保存AI回复
        this.addMessage('assistant', aiContent, toolResults, !isPureToolCall);
      }

    } catch (error) {
      loadingEl.remove();
      // 错误时保存用户消息和错误回复到历史
      await Storage.addChatMessage({ role: 'user', content: text });
      this.addMessage('assistant', `抱歉，发生错误：${error.message}`);
    } finally {
      this.isLoading = false;

      // 检查是否需要压缩记忆（每50条消息）
      const messageCount = await Storage.getMessageCount();
      if (messageCount >= 50) {
        console.log('达到50条消息，准备压缩记忆...');
        await this.compressMemory(settings);
      }
    }
  },

  async callAPI(settings, messages) {
    const url = `${settings.apiUrl}/chat/completions`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: settings.model || 'gpt-4o',
        messages,
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `API 错误: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  },

  async parseAndExecuteTools(content) {
    const toolResults = [];
    let cleanContent = content;

    // 匹配 JSON 代码块
    const jsonBlockRegex = /```json\s*([\s\S]*?)```/g;
    let match;

    while ((match = jsonBlockRegex.exec(content)) !== null) {
      try {
        const json = JSON.parse(match[1].trim());
        const result = await this.executeTool(json);
        if (result) {
          toolResults.push(result);
        }
        // 从内容中移除 JSON 块
        cleanContent = cleanContent.replace(match[0], '');
      } catch (e) {
        console.error('JSON 解析错误:', e);
      }
    }

    // 清理多余空行
    cleanContent = cleanContent.replace(/\n{3,}/g, '\n\n').trim();

    return { cleanContent, toolResults };
  },

  async executeTool(json) {
    const { tool, data } = json;

    switch (tool) {
      case 'add_nav':
        // 检查是否需要获取当前标签页信息
        if (data.url === '{{current_tab}}' || data.title === '{{current_tab}}') {
          const tabInfo = await this.getCurrentTabInfo();
          if (tabInfo) {
            if (data.url === '{{current_tab}}') {
              data.url = tabInfo.url;
            }
            if (data.title === '{{current_tab}}') {
              data.title = tabInfo.title;
            }
          }
        }

        // 如果 title 为空，自动提取一级域名
        if (!data.title || data.title === '') {
          data.title = this.extractDomainName(data.url);
        }

        const nav = await Navigation.addByAI(data);
        return { type: 'nav', success: true, data: nav, message: `已添加导航：${data.title}` };

      case 'add_bookmark':
        // 检查是否需要获取当前标签页信息
        if (data.url === '{{current_tab}}' || data.title === '{{current_tab}}') {
          const tabInfo = await this.getCurrentTabInfo();
          if (tabInfo) {
            if (data.url === '{{current_tab}}') {
              data.url = tabInfo.url;
            }
            if (data.title === '{{current_tab}}') {
              data.title = tabInfo.title;
            }
          }
        }

        // 如果 title 为空，自动提取URL最后一级路径
        if (!data.title || data.title === '') {
          data.title = this.extractLastPath(data.url);
        }

        const bookmark = await Storage.addBookmark(data);
        return { type: 'bookmark', success: true, data: bookmark, message: `已收藏：${data.title}` };

      case 'add_todo':
        const todo = await Todo.addByAI(data);
        return { type: 'todo', success: true, data: todo, message: `已创建待办：${data.text}` };

      case 'add_prompt':
        const prompt = await Prompt.addByAI(data);
        return { type: 'prompt', success: true, data: prompt, message: `已添加提示词：${data.title}` };

      case 'add_cmd':
        const cmd = await Command.addByAI(data);
        return { type: 'cmd', success: true, data: cmd, message: `已添加指令：${data.title}` };

      default:
        return null;
    }
  },

  // 获取当前标签页信息
  async getCurrentTabInfo() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_CURRENT_TAB' }, (response) => {
        if (response && response.success) {
          resolve(response.data);
        } else {
          resolve(null);
        }
      });
    });
  },

  // 提取一级域名（用于导航默认名称）
  // 例如：https://www.baidu.com/search?q=test → baidu.com
  extractDomainName(url) {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;

      // 移除 www. 前缀
      let domain = hostname.replace(/^www\./, '');

      // 提取主域名（去掉子域名）
      const parts = domain.split('.');
      if (parts.length >= 2) {
        // 取最后两部分，例如 baidu.com
        domain = parts.slice(-2).join('.');
      }

      return domain;
    } catch (e) {
      console.error('提取域名失败:', e);
      return url;
    }
  },

  // 提取URL最后一级路径（用于收藏默认名称）
  // 例如：https://a.b.c/d/e?f=112 → e
  // 例如：https://example.com/article/hello-world → hello-world
  extractLastPath(url) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // 移除末尾的斜杠
      const cleanPath = pathname.replace(/\/$/, '');

      // 分割路径
      const parts = cleanPath.split('/');

      // 获取最后一个非空部分
      const lastPart = parts.filter(p => p).pop();

      // 如果有最后一级，返回；否则返回域名
      if (lastPart) {
        return decodeURIComponent(lastPart);
      } else {
        return this.extractDomainName(url);
      }
    } catch (e) {
      console.error('提取路径失败:', e);
      return url;
    }
  },

  async addMessage(role, content, toolResults = [], saveToHistory = true) {
    // 保存到历史（可选）
    if (saveToHistory) {
      await Storage.addChatMessage({ role, content });
    }

    // 渲染消息
    this.renderMessage(role, content, true, toolResults);
    this.scrollToBottom();
  },

  renderMessage(role, content, animate = false, toolResults = []) {
    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${role}`;
    if (animate) messageEl.style.animation = 'fadeIn 0.3s ease';

    // 添加头像
    const avatarEl = document.createElement('div');
    avatarEl.className = 'chat-avatar';
    if (role === 'assistant') {
      avatarEl.innerHTML = '<img src="../icons/icon.jpg" alt="Assistant">';
    } else {
      // 用户头像：实心小人图标
      avatarEl.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
        </svg>
      `;
    }
    messageEl.appendChild(avatarEl);

    const bubbleEl = document.createElement('div');
    bubbleEl.className = 'chat-bubble';
    bubbleEl.innerHTML = this.formatContent(content);

    // 渲染工具结果卡片（放在气泡内部）
    if (toolResults.length > 0) {
      const toolsContainer = document.createElement('div');
      toolsContainer.className = 'tool-results-container';

      for (const result of toolResults) {
        const cardEl = this.createToolCard(result);
        toolsContainer.appendChild(cardEl);
      }

      bubbleEl.appendChild(toolsContainer);
    }

    messageEl.appendChild(bubbleEl);
    this.container.appendChild(messageEl);
  },

  createToolCard(result) {
    const { type, success, data, message } = result;

    // 获取工具信息
    const toolInfo = this.getToolInfo(type);

    // 创建卡片元素
    const cardEl = document.createElement('div');
    cardEl.className = 'tool-card';

    // 格式化数据内容
    const detailsHtml = this.formatToolDetails(type, data);

    cardEl.innerHTML = `
      <div class="tool-card-left">
        <div class="tool-card-icon">
          ${toolInfo.icon}
        </div>
        <div class="tool-card-content">
          <div class="tool-card-title">${toolInfo.name}</div>
          <div class="tool-card-details">${detailsHtml}</div>
        </div>
      </div>
      <div class="tool-card-status ${success ? 'success' : 'failed'}">
        ${success ? `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
          </svg>
        ` : `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
          </svg>
        `}
      </div>
    `;

    return cardEl;
  },

  getToolInfo(type) {
    const toolMap = {
      'todo': {
        name: '创建待办',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>`
      },
      'nav': {
        name: '添加导航',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
        </svg>`
      },
      'bookmark': {
        name: '添加收藏',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
        </svg>`
      },
      'prompt': {
        name: '添加提示词',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
          <path d="M9 18h6"/><path d="M10 22h4"/>
        </svg>`
      },
      'cmd': {
        name: '添加指令',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/>
        </svg>`
      }
    };

    return toolMap[type] || { name: '执行操作', icon: '<span>🔧</span>' };
  },

  formatToolDetails(type, data) {
    switch (type) {
      case 'todo':
        return `<span class="tool-detail-text">${data.text}</span>`;
      case 'nav':
        return `<span class="tool-detail-text">${data.title}</span>`;
      case 'bookmark':
        return `<span class="tool-detail-text">${data.title}</span>`;
      case 'prompt':
        return `<span class="tool-detail-text">${data.title}</span>`;
      case 'cmd':
        return `<span class="tool-detail-text">${data.title}</span>`;
      default:
        return '';
    }
  },

  formatContent(content) {
    // 简单的 Markdown 渲染
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  },

  showLoading() {
    const loadingEl = document.createElement('div');
    loadingEl.className = 'chat-message assistant';
    loadingEl.innerHTML = `
      <div class="chat-avatar">
        <img src="../icons/icon.jpg" alt="Assistant">
      </div>
      <div class="chat-bubble">
        <div class="loading-spinner" style="width:16px;height:16px;border-width:2px;"></div>
      </div>
    `;
    this.container.appendChild(loadingEl);
    this.scrollToBottom();
    return loadingEl;
  },

  scrollToBottom() {
    this.container.scrollTop = this.container.scrollHeight;
  },

  // 清除聊天记录
  async clearHistory() {
    if (!confirm('确定要清除所有聊天记录吗？此操作不可恢复。')) {
      return;
    }

    // 清空存储
    await Storage.set('chatHistory', []);

    // 清空界面
    this.container.innerHTML = '';

    // 重新加载（会显示欢迎消息）
    this.loadHistory();

    Toast.show('聊天记录已清除');
  },

  // 处理首次对话时的用户信息收集
  async handleFirstTimeSetup(text) {
    this.addMessage('user', text);
    this.input.value = '';
    this.sendBtn.style.display = 'none';

    const settings = await Storage.getSettings();

    // 检测用户是否选择跳过
    const skipKeywords = ['跳过', '不想', '不用', '算了', '不说', '不需要', 'skip', '不告诉'];
    const isSkip = skipKeywords.some(keyword => text.includes(keyword));

    if (isSkip) {
      // 用户选择跳过，标记已询问，继续正常对话
      await Storage.setHasAskedUserInfo(true);
      this.addMessage('assistant', '好的，没问题！我们直接开始吧。😊\n\n我可以帮你：\n• 添加快捷导航\n• 管理指令和提示词\n• 创建待办事项\n\n例如："帮我把百度加到导航"、"记个事，明天下午2点开会"、"收藏当前网页"');
      return;
    }

    // 显示加载状态
    this.isLoading = true;
    const loadingEl = this.showLoading();

    try {
      // 调用AI提取用户信息
      const extractPrompt = `请从用户的回复中提取称呼和性别信息，以JSON格式返回。

用户回复：${text}

要求：
1. 提取用户的称呼（name），如"小明"、"张三"，“刘哥”等
2. 提取用户的性别（gender），尝试从称呼中分析用户的性别，或者用户说帅哥，小哥哥，小姐姐等都是可以分析出性别，你返回是 "male"（男）或 "female"（女）
3. 如果无法确定任何一项，对应字段返回空字符串

请直接返回JSON，格式如下：
\`\`\`json
{"name": "称呼", "gender": "male或female"}
\`\`\`

只返回JSON代码块，不要其他解释。`;

      const messages = [
        { role: 'user', content: extractPrompt }
      ];

      const response = await this.callAPI(settings, messages);

      // 移除加载状态
      loadingEl.remove();

      // 解析JSON
      const jsonMatch = response.match(/```json\s*([\s\S]*?)```/);
      if (!jsonMatch) {
        throw new Error('无法解析AI响应');
      }

      const userInfo = JSON.parse(jsonMatch[1].trim());
      const name = userInfo.name?.trim();
      const gender = userInfo.gender?.trim();

      // 验证提取结果
      if (!name ) {
        this.addMessage('assistant', '你好呀，咱们认识下，我要怎么称呼你呀~\n\n如果不想说也可以说"跳过"。');
        return;
      }else{
          await Storage.setUserProfile({ name, gender });
      }

      if ( !gender || (gender !== 'male' && gender !== 'female')) {
        this.addMessage('assistant', '那你是小哥哥，还是小姐姐~');
        return;
      }else
      {
        await Storage.setUserProfile({ name, gender });
      }

      // 保存用户信息并标记已询问
      await Storage.setUserProfile({ name, gender });
      await Storage.setHasAskedUserInfo(true);

      // 欢迎消息
      const greeting ='';
      this.addMessage('assistant', `很高兴认识你，${name}${greeting}！✨\n\n我已经记住了。从现在开始，我会更好地为你服务。\n\n你可以试试：\n• "帮我把百度加到导航"\n• "记个事，明天下午2点开会"\n• "收藏当前网页"`);

    } catch (error) {
      loadingEl.remove();
      console.error('提取用户信息失败:', error);
      this.addMessage('assistant', '抱歉，我没有完全理解。请这样告诉我：\n\n例如："叫我小帅，帅哥" 或 "我叫小美，美女"\n\n如果不想提供也可以说"跳过"。');
    } finally {
      this.isLoading = false;
    }
  },

  // 压缩记忆
  async compressMemory(settings) {
    try {
      const history = await Storage.getChatHistory();
      const currentMemory = await Storage.getMemoryBank();
      const userProfile = await Storage.getUserProfile();

      // 构建压缩提示词
      const compressPrompt = `你是一个记忆管理助手。请分析以下对话历史，提取并总结与用户行为、偏好、习惯相关的重要信息。

## 用户信息
称呼：${userProfile?.name || '未知'}
性别：${userProfile?.gender === 'male' ? '男' : userProfile?.gender === 'female' ? '女' : '未知'}

## 当前记忆库
${currentMemory || '（暂无记忆）'}

## 最近对话（共${history.length}条）
${history.slice(-20).map((msg, i) => `${i + 1}. ${msg.role === 'user' ? '用户' : 'AI'}：${msg.content}`).join('\n')}

## 要求
1. 只保留用户行为、偏好、习惯相关的信息
2. 删除操作类信息（如"添加导航"、"创建待办"等）
3. 合并新旧记忆，去除重复
4. 总结后的记忆不超过800字
5. 用简洁的语句描述，便于理解

请直接输出总结后的记忆内容，不要其他解释。`;

      const messages = [
        { role: 'user', content: compressPrompt }
      ];

      // 调用 API 压缩记忆
      const compressedMemory = await this.callAPI(settings, messages);

      // 保存压缩后的记忆
      await Storage.setMemoryBank(compressedMemory);

      // 重置计数器
      await Storage.resetMessageCount();

      console.log('记忆压缩完成:', compressedMemory);
    } catch (error) {
      console.error('记忆压缩失败:', error);
    }
  }
};

window.Assistant = Assistant;

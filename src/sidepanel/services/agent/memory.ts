/**
 * AG.NEXUS - 简化的记忆管理 (TypeScript)
 * 不使用 LangChain 的 Memory 类，自己实现
 */

import { Storage } from '../storage'
import type { ChatMessage } from '../types'

/**
 * AG Nexus 自定义记忆管理器
 * - 从 Chrome Storage 加载历史消息（最多 20 条）
 * - 自动压缩记忆（每 50 条消息）
 * - 动态生成系统提示词
 */
export class AGNexusMemory {
  private maxMessages = 20 // 保留最近 20 条消息
  private compressionThreshold = 50 // 每 50 条压缩一次

  /**
   * 初始化记忆：从 Storage 加载历史
   */
  async initialize(): Promise<boolean> {
    // 不需要特殊初始化，直接从 Storage 读取
    return true
  }

  /**
   * 获取聊天历史（LangChain 消息格式）
   */
  async getMessages(): Promise<ChatMessage[]> {
    const history = await Storage.getChatHistory()
    return history.slice(-this.maxMessages)
  }

  /**
   * 添加用户消息
   */
  async addUserMessage(content: string): Promise<void> {
    await Storage.addChatMessage({ role: 'user', content })
    await this.checkCompression()
  }

  /**
   * 添加 AI 消息
   */
  async addAIMessage(content: string): Promise<void> {
    await Storage.addChatMessage({ role: 'assistant', content })
    await this.checkCompression()
  }

  /**
   * 获取动态系统提示词
   */
  async getSystemPrompt(): Promise<string> {
    const now = new Date()
    const currentTime = now.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
    })

    const userProfile = await Storage.getUserProfile()
    const memoryBank = await Storage.getMemoryBank()
    const todos = await Storage.getTodos()
    const pendingTodos = todos.filter((t) => !t.done)

    // 构建待办列表文本
    let todosText = ''
    if (pendingTodos.length > 0) {
      todosText = '\n\n## 当前未完成待办清单\n'
      pendingTodos.slice(0, 10).forEach((todo, index) => {
        const priorityEmoji = { high: '🔴', medium: '🟡', low: '🟢' }[todo.priority] || '⚪'
        todosText += `${index + 1}. ${priorityEmoji} ${todo.text}\n`
        if (todo.reminderEnabled) {
          todosText += `   ⏰ 提醒时间：${todo.startDate} ${todo.reminderTime}\n`
        }
      })
    }

    let userInfo = ''
    if (userProfile && userProfile.name) {
      userInfo = `\n\n## 用户信息\n称呼：${userProfile.name}`
      if (userProfile.gender) {
        userInfo += `\n性别：${userProfile.gender}`
      }
    }

    let memoryText = ''
    if (memoryBank) {
      memoryText = `\n\n## 记忆库\n${memoryBank}`
    }

    return `你是一个智能的浏览器侧边栏助手 AG Nexus，也叫小G，回复语气简短，扮演25岁俏皮女孩的回复语气。

## 当前时间
${currentTime}${userInfo}${memoryText}
${todosText}

## 你的职责
1. 待办管理助手 - 帮助用户创建、管理待办事项
2. 数据操作助手 - 通过工具调用帮助用户添加导航、收藏、提示词、指令
3. 对话助手 - 提供友好、简洁的对话体验

## 用户信息处理
- 如果用户姓名未知（上方用户信息为空），请在第一次回复时礼貌地询问用户的名字
- 如果用户忽略该问题继续其他对话，不要强迫用户回答，继续正常对话即可
- 当用户告诉你ta的名字或性别时，使用 save_user_profile 工具保存
- 保存后可以用更亲切的称呼与用户交流

## 工具使用说明
- 使用工具时请直接调用，不要在回复中包含 JSON 代码块
- title 字段可以为空字符串，系统会自动提取
- url 字段支持 {{current_tab}} 标识当前网页
- 待办的 dateType 支持：today（今天）、tomorrow（明天）、thisweek（本周）、other（其他）
- 优先级支持：low（低）、medium（中）、high（高）

## 回复风格
- 简短俏皮，不要过于正式
- 使用 emoji 增加趣味性
- 主动提醒用户关注紧急待办事项`
  }

  /**
   * 检查是否需要压缩记忆
   */
  private async checkCompression(): Promise<void> {
    const messageCount = await Storage.getMessageCount()
    if (messageCount >= this.compressionThreshold) {
      await this.compressMemory()
    }
  }

  /**
   * 压缩记忆（调用 AI 总结）
   */
  private async compressMemory(): Promise<void> {
    try {
      const settings = await Storage.getSettings()
      const history = await Storage.getChatHistory()
      const currentMemory = await Storage.getMemoryBank()

      // 构建压缩提示词
      const messages = history
        .slice(-20)
        .map((m) => `${m.role === 'user' ? '用户' : 'AI'}：${m.content}`)
        .join('\n')
      const compressPrompt = `分析以下对话，提取用户的行为模式、偏好、需求，总结为不超过800字的用户画像和记忆。

## 当前记忆库
${currentMemory || '无'}

## 最近对话
${messages}

请提取：
1. 用户的工作领域、职业特点
2. 使用习惯和偏好
3. 重要的需求和关注点
4. 其他值得记忆的信息

要求：简洁、结构化，不超过800字。`

      // 调用 API 压缩
      const response = await fetch(`${settings.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify({
          model: settings.model,
          messages: [{ role: 'user', content: compressPrompt }],
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status}`)
      }

      const data = await response.json()
      const compressedMemory = data.choices[0].message.content

      // 保存压缩后的记忆
      await Storage.setMemoryBank(compressedMemory)
      await Storage.resetMessageCount()

      console.log('记忆已压缩，长度:', compressedMemory.length)
    } catch (error) {
      console.error('记忆压缩失败:', error)
      // 即使压缩失败，也重置计数器避免频繁尝试
      await Storage.resetMessageCount()
    }
  }

  /**
   * 清空记忆
   */
  async clear(): Promise<void> {
    await Storage.set('chatHistory', [])
    await Storage.setMemoryBank('')
    await Storage.resetMessageCount()
  }
}

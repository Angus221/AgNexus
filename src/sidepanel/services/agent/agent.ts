/**
 * AG.NEXUS - LangChain Agent 核心 (TypeScript)
 */

import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages'
import { allTools } from './tools'
import { AGNexusMemory } from './memory'
import { Storage } from '../storage'
import { fetchRssFeed, parseRssItems } from './rss'

/**
 * Agent 响应结果
 */
export interface AgentResponse {
  success: boolean
  content?: string
  toolCalls?: any[]
  error?: string
}

/**
 * AG Nexus LangChain Agent
 * 基于 LangChain 的智能助手
 */
export class AGNexusAgent {
  private memory: AGNexusMemory | null = null
  private model: ChatOpenAI | null = null
  private visionModel: ChatOpenAI | null = null
  private modelWithTools: any = null
  private visionModelWithTools: any = null
  private isInitialized = false

  /**
   * 初始化 Agent
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      const settings = await Storage.getSettings()

      if (!settings.apiKey) {
        throw new Error('未设置 API Key，请前往设置页面配置')
      }

      // 1. 初始化 ChatOpenAI (Text)
      this.model = new ChatOpenAI({
        apiKey: settings.apiKey,
        modelName: settings.model || 'qwen-turbo',
        temperature: 0.7,
        maxTokens: 2000,
        configuration: {
          baseURL: settings.apiUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        },
      })

      // 2. 初始化 ChatOpenAI (Vision)
      this.visionModel = new ChatOpenAI({
        apiKey: settings.apiKey,
        modelName: settings.visionModel || 'qwen3-vl-flash',
        temperature: 0.7,
        maxTokens: 2000,
        configuration: {
          baseURL: settings.apiUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        },
      })

      // 3. 绑定工具到模型
      this.modelWithTools = this.model.bindTools(allTools)
      this.visionModelWithTools = this.visionModel.bindTools(allTools)

      // 4. 初始化记忆
      this.memory = new AGNexusMemory()
      await this.memory.initialize()

      this.isInitialized = true
      console.log('AG Nexus Agent 初始化完成')
    } catch (error) {
      console.error('Agent 初始化失败:', error)
      throw error
    }
  }

  /**
   * 发送消息到 Agent
   */
  async chat(userInput: string, images?: string[]): Promise<AgentResponse> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    if (!this.memory || !this.modelWithTools || !this.visionModelWithTools) {
      return {
        success: false,
        error: 'Agent 未正确初始化',
      }
    }

    try {
      // 获取系统提示词
      let systemPrompt = await this.memory.getSystemPrompt()

      // 检查是否需要问候
      const { hasAskedUserInfo, userProfile } = await Storage.getAll()
      if (!hasAskedUserInfo && !userProfile?.name) {
        systemPrompt += `\n\n【重要任务】这是你与用户的初次见面。请在回答用户的任何问题之前，先礼貌地问候用户，并询问该如何称呼他（例如："初次见面，请问怎么称呼您？"）。如果用户已经在本次输入中提供了名字，请立即调用 save_user_profile 工具保存。`
        // 标记为已询问
        await Storage.set('hasAskedUserInfo', true)
      }

      // 获取聊天历史
      const chatHistory = await this.memory.getMessages()

      // 构建消息
      let userMessageContent: any = userInput
      if (images && images.length > 0) {
        userMessageContent = [
          { type: 'text', text: userInput },
          ...images.map((img) => ({
            type: 'image_url',
            image_url: { url: img },
          })),
        ]
      }

      const messages = [
        new SystemMessage(systemPrompt),
        ...chatHistory.map((msg) =>
          msg.role === 'user' ? new HumanMessage(msg.content) : new AIMessage(msg.content)
        ),
        new HumanMessage({ content: userMessageContent }),
      ]

      // 选择模型
      const modelToUse =
        images && images.length > 0 ? this.visionModelWithTools : this.modelWithTools

      // 调用带工具的模型
      const response = await modelToUse.invoke(messages)

      // 检查是否有工具调用
      if (response.tool_calls && response.tool_calls.length > 0) {
        // 执行工具调用
        const toolResults: string[] = []
        for (const toolCall of response.tool_calls) {
          const tool = allTools.find((t) => t.name === toolCall.name)
          if (tool) {
            try {
              const result = await tool.func(toolCall.args)
              toolResults.push(result)
            } catch (error) {
              const message = error instanceof Error ? error.message : String(error)
              toolResults.push(`工具执行失败：${message}`)
            }
          }
        }

        // 合并工具结果
        const finalResult = toolResults.join('\n')

        // 保存消息
        const savedUserContent = userInput + (images && images.length > 0 ? ' [已发送图片]' : '')
        await this.memory.addUserMessage(savedUserContent)
        await this.memory.addAIMessage(finalResult)

        return {
          success: true,
          content: finalResult,
          toolCalls: response.tool_calls,
        }
      }

      // 普通响应
      const savedUserContent = userInput + (images && images.length > 0 ? ' [已发送图片]' : '')
      await this.memory.addUserMessage(savedUserContent)
      await this.memory.addAIMessage(response.content)

      return {
        success: true,
        content: response.content,
        toolCalls: [],
      }
    } catch (error) {
      console.error('Agent 执行失败:', error)
      const message = error instanceof Error ? error.message : String(error)
      return {
        success: false,
        error: message,
      }
    }
  }

  /**
   * 清空聊天历史
   */
  async clearHistory(): Promise<void> {
    if (this.memory) {
      await this.memory.clear()
    }
    this.isInitialized = false
    console.log('聊天历史已清空')
  }

  /**
   * 生成早报
   */
  async generateMorningReport(): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    if (!this.model) {
      return '无法生成早报：Agent 未初始化'
    }

    try {
      const { rssSources, todos, userProfile, settings } = await Storage.getAll()

      // 1. 获取 RSS 内容
      let rssContent = ''
      if (rssSources && rssSources.length > 0) {
        const feedPromises = rssSources.map(async (source) => {
          if (!source.enabled) return ''
          const xml = await fetchRssFeed(source.url)
          if (!xml) return ''
          const items = parseRssItems(xml)
          if (items.length === 0) return ''
          return `【${source.title}】:\n` + items.map((i) => `- ${i.title}: ${i.description}`).join('\n')
        })
        const feeds = await Promise.all(feedPromises)
        // 限制 RSS 总字数，简单截断，防止 Token 溢出
        rssContent = feeds.filter((f) => f).join('\n\n').slice(0, 3000) 
      }

      // 2. 获取今日待办
      const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
      const todayTodos = todos.filter((t) => {
        if (t.done) return false
        if (t.dateType === 'today') return true
        if (t.startDate && t.startDate.startsWith(today)) return true
        return false
      })
      const todoContent =
        todayTodos.map((t) => `- [${t.priority}] ${t.text}`).join('\n') || '暂无待办'

      // 3. 生成 Prompt
      const customPrompt = settings.morningReportPrompt ? `\n\n【特别指示】${settings.morningReportPrompt}` : ''
      
      const prompt = `
      请为用户${userProfile?.name ? ' ' + userProfile.name : ''}生成一份今日早报。
      
      【今日待办】
      ${todoContent}
      
      【订阅资讯】
      ${rssContent || '暂无订阅资讯'}
      ${customPrompt}

      请用热情、专业的语气汇总以上信息。
      1. 先总结今日待办重点。
      2. 然后精选几条重要的资讯进行简述（如果资讯太多，只选最重要的3条；请确保RSS相关内容的总字数控制在600字以内；如果没有资讯，则跳过此部分）。
      3. 最后给出一句鼓励的话。
      `

      // 4. 调用模型 (使用 Text Model)
      const response = await this.model.invoke([new HumanMessage(prompt)])
      const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content)
      
      // 保存到记忆
      await this.memory?.addAIMessage(`📅 **今日早报**\n\n${content}`)
      
      return content
    } catch (error) {
      console.error('生成早报失败:', error)
      return '生成早报时遇到了一些问题。'
    }
  }

  /**
   * 重新初始化（用于更新设置后）
   */
  async reinitialize(): Promise<void> {
    this.isInitialized = false
    await this.initialize()
  }
}

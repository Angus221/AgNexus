/**
 * AG.NEXUS - LangChain Agent 核心 (TypeScript)
 */

import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages'
import { allTools } from './tools'
import { AGNexusMemory } from './memory'
import { Storage } from '../storage'

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
  private modelWithTools: any = null
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

      // 1. 初始化 ChatOpenAI
      this.model = new ChatOpenAI({
        apiKey: settings.apiKey,
        modelName: settings.model || 'qwen-turbo',
        temperature: 0.7,
        maxTokens: 2000,
        configuration: {
          baseURL: settings.apiUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        },
      })

      // 2. 绑定工具到模型
      this.modelWithTools = this.model.bindTools(allTools)

      // 3. 初始化记忆
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
  async chat(userInput: string): Promise<AgentResponse> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    if (!this.memory || !this.modelWithTools) {
      return {
        success: false,
        error: 'Agent 未正确初始化',
      }
    }

    try {
      // 获取系统提示词
      const systemPrompt = await this.memory.getSystemPrompt()

      // 获取聊天历史
      const chatHistory = await this.memory.getMessages()

      // 构建消息
      const messages = [
        new SystemMessage(systemPrompt),
        ...chatHistory.map((msg) =>
          msg.role === 'user' ? new HumanMessage(msg.content) : new AIMessage(msg.content)
        ),
        new HumanMessage(userInput),
      ]

      // 调用带工具的模型
      const response = await this.modelWithTools.invoke(messages)

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
        await this.memory.addUserMessage(userInput)
        await this.memory.addAIMessage(finalResult)

        return {
          success: true,
          content: finalResult,
          toolCalls: response.tool_calls,
        }
      }

      // 普通响应
      await this.memory.addUserMessage(userInput)
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
   * 重新初始化（用于更新设置后）
   */
  async reinitialize(): Promise<void> {
    this.isInitialized = false
    await this.initialize()
  }
}

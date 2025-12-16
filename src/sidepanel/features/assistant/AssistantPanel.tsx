/**
 * AG.NEXUS - AI 助理面板
 */

import { useState, useEffect, useRef } from 'react'
import { ScrollShadow, Button, Spinner, Link, Avatar } from '@heroui/react'
import { Trash2, Settings } from 'lucide-react'
import { ChatMessage } from '../../components/chat/ChatMessage'
import { ChatInput } from '../../components/chat/ChatInput'
import { AGNexusAgent } from '../../services/agent/agent'
import { Storage } from '../../services/storage'
import type { ChatMessage as ChatMessageType } from '../../services/types'
import { useTab } from '../../contexts/TabContext'
import toast from 'react-hot-toast'

export function AssistantPanel() {
  const [messages, setMessages] = useState<ChatMessageType[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [agent, setAgent] = useState<AGNexusAgent | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [hasApiKey, setHasApiKey] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { setActiveTab } = useTab()

  // 初始化 Agent
  useEffect(() => {
    const init = async () => {
      try {
        setIsInitializing(true)

        // 检查 API Key 是否已配置
        const settings = await Storage.getSettings()
        if (!settings.apiKey) {
          setHasApiKey(false)
          setIsInitializing(false)
          return
        }

        setHasApiKey(true)
        const agentInstance = new AGNexusAgent()
        await agentInstance.initialize()
        setAgent(agentInstance)

        // 加载历史消息
        const history = await Storage.getChatHistory()
        setMessages(history)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        toast.error(`初始化失败: ${message}`)
        console.error('Agent 初始化失败:', error)
      } finally {
        setIsInitializing(false)
      }
    }
    init()
  }, [])

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // 发送消息
  const handleSend = async (input: string) => {
    if (!agent) {
      toast.error('Agent 未初始化')
      return
    }

    // 添加用户消息到界面
    const userMessage: ChatMessageType = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      // 调用 Agent
      const response = await agent.chat(input)

      if (response.success && response.content) {
        // 添加 AI 回复到界面
        const aiMessage: ChatMessageType = {
          role: 'assistant',
          content: response.content,
          timestamp: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, aiMessage])
      } else {
        toast.error(response.error || '发送失败')
        // 移除用户消息
        setMessages((prev) => prev.slice(0, -1))
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      toast.error(`发送失败: ${message}`)
      // 移除用户消息
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setIsLoading(false)
    }
  }

  // 清空历史
  const handleClear = async () => {
    if (!confirm('确定要清空所有聊天记录吗？')) return

    try {
      if (agent) {
        await agent.clearHistory()
      }
      await Storage.clearChatHistory()
      setMessages([])
      toast.success('已清空聊天记录')
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      toast.error(`清空失败: ${message}`)
    }
  }

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Spinner size="lg" color="primary" />
          <p className="text-default-500 mt-4">正在初始化 AI 助理...</p>
        </div>
      </div>
    )
  }

  // API Key 未配置的提示消息
  const apiKeyMissingMessage: ChatMessageType = {
    role: 'assistant',
    content: `你好！我是 AG Nexus 助理 🤖

在开始使用之前，需要先配置 API Key。

请点击下方链接前往设置页面完成配置：`,
    timestamp: new Date().toISOString(),
  }

  return (
    <div className="flex flex-col h-full">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between p-2 border-b border-divider/50">
        <div className="flex items-center gap-2">
          <Avatar
            radius="lg"
            size="sm"
            src="/icons/icon128.png"
          />
          <span className="text-sm font-medium">AI 助理</span>
        </div>
        <Button
          size="sm"
          variant="light"
          color="danger"
          isIconOnly
          onPress={handleClear}
          isDisabled={messages.length === 0 || !hasApiKey}
          title="清空记录"
        >
          <Trash2 size={16} />
        </Button>
      </div>

      {/* 聊天区域 */}
      <ScrollShadow
        ref={scrollRef}
        className="flex-1 px-4 pt-4 pb-8 overflow-y-auto"
        hideScrollBar
      >
        {!hasApiKey ? (
          // API Key 未配置时显示机器人提示
          <div className="space-y-4">
            <ChatMessage message={apiKeyMissingMessage} />
            <div className="flex justify-start pl-10">
              <Link
                className="flex items-center gap-2 text-primary cursor-pointer hover:underline"
                onPress={() => setActiveTab('settings')}
              >
                <Settings size={16} />
                <span>前往设置页面配置 API Key</span>
              </Link>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-default-400">
              <p className="text-lg mb-2">👋 你好！我是 AG Nexus 助理</p>
              <p className="text-sm">有什么可以帮助你的吗？</p>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <ChatMessage key={`${msg.timestamp}-${index}`} message={msg} />
          ))
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-default-400 mb-4">
            <Spinner size="sm" />
            <span className="text-sm">正在思考...</span>
          </div>
        )}
      </ScrollShadow>

      {/* 输入区域 */}
      <ChatInput
        onSend={handleSend}
        disabled={isLoading || !agent || !hasApiKey}
        placeholder={hasApiKey ? "输入消息... (Enter 发送)" : "请先配置 API Key"}
      />
    </div>
  )
}

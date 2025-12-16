/**
 * AG.NEXUS - AI 助理面板
 */

import { useState, useEffect, useRef } from 'react'
import { ScrollShadow, Button, Spinner, Avatar, Card, CardBody } from '@heroui/react'
import { Trash2, Settings, RefreshCw } from 'lucide-react'
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

        // 检查早报
        checkMorningReport(agentInstance)
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

  const checkMorningReport = async (agentInstance: AGNexusAgent) => {
    try {
      const today = new Date().toISOString().slice(0, 10)
      const lastDate = await Storage.getMorningReportDate()

      if (lastDate !== today) {
        const toastId = toast.loading('正在为您生成今日早报...')
        const report = await agentInstance.generateMorningReport()
        toast.dismiss(toastId)
        
        if (report) {
          const reportMsg: ChatMessageType = {
            role: 'assistant',
            content: `📅 **今日早报**\n\n${report}`,
            timestamp: new Date().toISOString(),
          }
          setMessages((prev) => [...prev, reportMsg])
          await Storage.setMorningReportDate(today)
        }
      }
    } catch (e) {
      console.error('早报生成失败:', e)
    }
  }

  const handleRegenerateMorningReport = async () => {
    if (!agent) return
    
    // 重置早报日期
    await Storage.setMorningReportDate('')
    
    // 手动触发生成
    const toastId = toast.loading('正在为您重新生成早报...')
    try {
      const report = await agent.generateMorningReport()
      toast.dismiss(toastId)
      
      if (report) {
        const reportMsg: ChatMessageType = {
          role: 'assistant',
          content: `📅 **今日早报 (重新生成)**\n\n${report}`,
          timestamp: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, reportMsg])
        // 更新日期为今天
        await Storage.setMorningReportDate(new Date().toISOString().slice(0, 10))
      }
    } catch (e) {
      toast.dismiss(toastId)
      toast.error('生成失败')
    }
  }

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // 发送消息
  const handleSend = async (input: string, images?: string[]) => {
    if (!agent) {
      toast.error('Agent 未初始化')
      return
    }

    // 添加用户消息到界面
    const userMessage: ChatMessageType = {
      role: 'user',
      content: input,
      images: images,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      // 调用 Agent
      const response = await agent.chat(input, images)

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
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="light"
            isIconOnly
            onPress={handleRegenerateMorningReport}
            isDisabled={!agent || !hasApiKey}
            title="重新生成今日早报"
          >
            <RefreshCw size={16} />
          </Button>
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
      </div>

      {/* 聊天区域 */}
      {!hasApiKey ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full max-w-sm">
            <CardBody className="text-center py-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-4">
                <Settings size={32} />
              </div>
              <h2 className="text-xl font-bold mb-2">欢迎使用 AI 助理</h2>
              <p className="text-default-500 text-sm mb-6">
                请先配置 API Key 以启用智能对话功能。<br />
                支持阿里云百炼 (Qwen) 或 OpenAI 格式接口。
              </p>
              <Button
                color="primary"
                onPress={() => setActiveTab('settings')}
                className="w-full"
              >
                前往设置
              </Button>
            </CardBody>
          </Card>
        </div>
      ) : (
        <>
          <ScrollShadow
            ref={scrollRef}
            className="flex-1 px-4 pt-4 pb-8 overflow-y-auto"
            hideScrollBar
          >
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-default-400">
                  <p className="text-lg mb-2">👋 你好！我是 AG Nexus 助理</p>
                  <p className="text-sm">有什么可以帮助你的吗？</p>
                </div>
              </div>
            ) : (
              messages.map((msg, index) => (
                <ChatMessage key={index} message={msg} />
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-default-100 rounded-lg p-4">
                  <Spinner size="sm" />
                </div>
              </div>
            )}
          </ScrollShadow>

          {/* 输入框 */}
          <div className="p-4 border-t border-divider/50 bg-background/50 backdrop-blur-md">
            <ChatInput onSend={handleSend} isLoading={isLoading} />
          </div>
        </>
      )}
    </div>
  )
}

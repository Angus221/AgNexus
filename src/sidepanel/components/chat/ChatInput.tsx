/**
 * AG.NEXUS - 聊天输入组件
 */

import { useState, KeyboardEvent } from 'react'
import { Input, Button } from '@heroui/react'
import { Send, Loader2 } from 'lucide-react'

interface ChatInputProps {
  onSend: (message: string) => void | Promise<void>
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = '输入消息...',
}: ChatInputProps) {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim() || disabled || isLoading) return

    const message = input.trim()
    setInput('')
    setIsLoading(true)

    try {
      await onSend(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="p-3 pb-4 border-t border-divider/50 bg-background/80 backdrop-blur-sm">
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || isLoading}
        variant="faded"
        radius="full"
        size="lg"
        classNames={{
          input: 'text-sm',
          inputWrapper: 'shadow-sm pr-1',
        }}
        endContent={
          <Button
            isIconOnly
            color="primary"
            size="sm"
            radius="full"
            onPress={handleSend}
            isDisabled={!input.trim() || disabled || isLoading}
            className="min-w-8 h-8"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </Button>
        }
      />
    </div>
  )
}

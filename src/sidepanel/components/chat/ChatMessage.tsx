/**
 * AG.NEXUS - 聊天消息组件
 */

import { Card, CardBody, Avatar } from '@heroui/react'
import { User } from 'lucide-react'
import { MarkdownRenderer } from './MarkdownRenderer'
import type { ChatMessage as ChatMessageType } from '../../services/types'

interface ChatMessageProps {
  message: ChatMessageType
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex gap-3 mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <Avatar
          src="/icons/icon128.png"
          className="shrink-0"
          size="sm"
          isBordered
          color="primary"
        />
      )}

      <Card
        className={`max-w-[80%] ${isUser ? 'bg-primary text-primary-foreground' : 'bg-default-100'}`}
        shadow={isUser ? 'sm' : 'none'}
        radius="lg"
      >
        <CardBody className="py-2.5 px-3.5">
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="text-sm">
              <MarkdownRenderer content={message.content} />
            </div>
          )}
        </CardBody>
      </Card>

      {isUser && (
        <Avatar
          icon={<User size={18} />}
          className="shrink-0"
          classNames={{
            base: 'bg-default-100',
            icon: 'text-default-600',
          }}
          size="sm"
          isBordered
        />
      )}
    </div>
  )
}

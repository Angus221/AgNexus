/**
 * AG.NEXUS - 聊天输入组件
 */

import { useState, KeyboardEvent, useRef, ClipboardEvent, ChangeEvent } from 'react'
import { Input, Button, Image } from '@heroui/react'
import { Send, Loader2, Image as ImageIcon, X } from 'lucide-react'

interface ChatInputProps {
  onSend: (message: string, images?: string[]) => void | Promise<void>
  disabled?: boolean
  isLoading?: boolean
  placeholder?: string
}

export function ChatInput({
  onSend,
  disabled = false,
  isLoading = false,
  placeholder = '输入消息... (支持粘贴图片)',
}: ChatInputProps) {
  const [input, setInput] = useState('')
  const [images, setImages] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = async () => {
    if ((!input.trim() && images.length === 0) || disabled || isLoading) return

    const message = input.trim()
    const currentImages = [...images]
    
    setInput('')
    setImages([])
    
    await onSend(message, currentImages)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData.items
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault()
        const blob = item.getAsFile()
        if (blob) {
          const reader = new FileReader()
          reader.onload = (event) => {
            if (typeof event.target?.result === 'string') {
              setImages((prev) => [...prev, event.target!.result as string])
            }
          }
          reader.readAsDataURL(blob)
        }
      }
    }
  }

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          setImages((prev) => [...prev, event.target!.result as string])
        }
      }
      reader.readAsDataURL(file)
      // 清空 input 允许重复选择同一文件
      e.target.value = ''
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-2">
      {/* 图片预览区域 */}
      {images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((img, index) => (
            <div key={index} className="relative flex-shrink-0">
              <Image
                src={img}
                alt="preview"
                className="w-20 h-20 object-cover rounded-lg border border-divider"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute -top-1 -right-1 bg-danger text-white rounded-full p-0.5 shadow-md z-10"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileSelect}
        />
        <Button
          isIconOnly
          variant="light"
          radius="full"
          size="sm"
          onPress={() => fileInputRef.current?.click()}
          className="mb-1 text-default-500"
          isDisabled={disabled || isLoading}
        >
          <ImageIcon size={20} />
        </Button>

        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
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
              isDisabled={(!input.trim() && images.length === 0) || disabled || isLoading}
              className="min-w-8 h-8"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </Button>
          }
        />
      </div>
    </div>
  )
}

/**
 * AG.NEXUS - 指令面板
 */

import { useState, useEffect, KeyboardEvent } from 'react'
import {
  Button,
  Input,
  Spinner,
  ScrollShadow,
  Chip,
  Snippet,
} from '@heroui/react'
import { Plus, Trash2 } from 'lucide-react'
import { Storage } from '../../services/storage'
import type { Command } from '../../services/types'
import toast from 'react-hot-toast'

export function CommandPanel() {
  const [commands, setCommands] = useState<Command[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    loadCommands()
  }, [])

  const loadCommands = async () => {
    try {
      const data = await Storage.getCommands()
      setCommands(data)
    } catch (error) {
      console.error('加载指令失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdd = async () => {
    const code = inputValue.trim()
    if (!code) {
      toast.error('请输入指令内容')
      return
    }

    // 自动提取第一个单词作为名称
    const title = code.split(/\s+/)[0] || code.slice(0, 10)

    try {
      const newCmd = await Storage.addCommand({ title, code })
      setCommands([newCmd, ...commands])
      setInputValue('')
      toast.success('指令已添加')
    } catch (error) {
      toast.error('添加失败')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAdd()
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await Storage.removeCommand(id)
      setCommands(commands.filter((c) => c.id !== id))
      toast.success('指令已删除')
    } catch (error) {
      toast.error('删除失败')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" color="primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* 输入栏 */}
      <div className="p-3 border-b border-divider/50">
        <Input
          placeholder="输入指令内容，回车添加..."
          value={inputValue}
          onValueChange={setInputValue}
          onKeyDown={handleKeyDown}
          size="sm"
          variant="faded"
          radius="lg"
          classNames={{
            inputWrapper: 'pr-1',
          }}
          endContent={
            <Button
              isIconOnly
              color="primary"
              size="sm"
              radius="lg"
              onPress={handleAdd}
              isDisabled={!inputValue.trim()}
              className="min-w-7 h-7"
            >
              <Plus size={14} />
            </Button>
          }
        />
      </div>

      {/* 指令列表 */}
      <ScrollShadow className="flex-1 px-3 py-2" hideScrollBar>
        {commands.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-default-400">
              <p className="text-4xl mb-4">💻</p>
              <p className="text-sm">输入指令内容，回车添加</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {commands.map((cmd) => (
              <div
                key={cmd.id}
                className="group flex items-center gap-2 px-3 py-2 bg-content1 rounded-xl shadow-sm border border-default-100 hover:border-default-200 transition-all"
              >
                {/* 名称标签 */}
                <Chip
                  size="sm"
                  variant="flat"
                  color="primary"
                  classNames={{
                    base: 'h-6 px-2 shrink-0',
                    content: 'text-xs font-medium',
                  }}
                >
                  {cmd.title}
                </Chip>

                {/* 指令内容 + 复制按钮 */}
                <Snippet
                  symbol=""
                  codeString={cmd.code}
                  size="sm"
                  variant="flat"
                  classNames={{
                    base: 'flex-1 min-w-0 bg-transparent p-0 gap-1',
                    pre: 'font-mono text-xs truncate',
                    copyButton: 'min-w-6 h-6 text-default-400 data-[hover=true]:text-primary',
                  }}
                >
                  <span className="truncate">{cmd.code}</span>
                </Snippet>

                {/* 删除按钮 */}
                <Button
                  isIconOnly
                  size="sm"
                  color="danger"
                  variant="light"
                  className="opacity-0 group-hover:opacity-100 min-w-6 h-6 shrink-0"
                  onPress={() => handleDelete(cmd.id)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollShadow>
    </div>
  )
}

/**
 * AG.NEXUS - 待办面板
 */

import { useState, useEffect, KeyboardEvent } from 'react'
import {
  Button,
  Card,
  CardBody,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Spinner,
  Input,
  Checkbox,
  RadioGroup,
  Radio,
  Switch,
  Chip,
  Progress,
} from '@heroui/react'
import { Plus, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Storage } from '../../services/storage'
import type { Todo } from '../../services/types'
import toast from 'react-hot-toast'

// 撒花动画
const fireConfetti = () => {
  const count = 80
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  }

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    })
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  })
  fire(0.2, {
    spread: 60,
  })
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  })
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  })
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  })
}

// 动画变体
const itemVariants = {
  initial: { opacity: 0, y: -20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, x: -100, scale: 0.9 },
}

export function TodoPanel() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [quickInput, setQuickInput] = useState('')

  // 表单状态
  const [text, setText] = useState('')
  const [dateType, setDateType] = useState<string>('today')
  const [customDate, setCustomDate] = useState('')
  const [reminderEnabled, setReminderEnabled] = useState(false)
  const [reminderTime, setReminderTime] = useState('18:00')
  const [priority, setPriority] = useState<string>('low')

  useEffect(() => {
    loadTodos()
  }, [])

  const loadTodos = async () => {
    try {
      const data = await Storage.getTodos()
      setTodos(data)
    } catch (error) {
      console.error('加载待办失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getStartDate = (): string => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    switch (dateType) {
      case 'today':
        return formatDate(today)
      case 'tomorrow':
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        return formatDate(tomorrow)
      case 'thisweek':
        const sunday = new Date(today)
        const dayOfWeek = today.getDay()
        const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
        sunday.setDate(sunday.getDate() + daysUntilSunday)
        return formatDate(sunday)
      case 'other':
        return customDate
      default:
        return formatDate(today)
    }
  }

  // 快速添加待办（默认今天）
  const handleQuickAdd = async () => {
    if (!quickInput.trim()) return

    const todayStr = formatDate(new Date())
    try {
      const newTodo = await Storage.addTodo({
        text: quickInput.trim(),
        dateType: 'today',
        startDate: todayStr,
        reminderEnabled: false,
        reminderTime: null,
        priority: 'low',
      })
      setTodos([newTodo, ...todos])
      setQuickInput('')
      toast.success('待办已添加')
    } catch (error) {
      toast.error('添加失败')
    }
  }

  const handleQuickInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleQuickAdd()
    }
  }

  const handleSave = async () => {
    if (!text.trim()) {
      toast.error('请填写任务内容')
      return
    }

    if (dateType === 'other' && !customDate) {
      toast.error('请选择具体日期')
      return
    }

    const data = {
      text: text.trim(),
      dateType: dateType as Todo['dateType'],
      startDate: getStartDate(),
      reminderEnabled,
      reminderTime: reminderEnabled ? reminderTime : null,
      priority: priority as Todo['priority'],
    }

    try {
      if (editingId) {
        await Storage.updateTodo(editingId, data)
        setTodos(todos.map((t) => (t.id === editingId ? { ...t, ...data } : t)))
        toast.success('待办已更新')
      } else {
        const newTodo = await Storage.addTodo(data)
        setTodos([newTodo, ...todos])
        toast.success('待办已添加')
      }
      closeModal()
    } catch (error) {
      toast.error('保存失败')
    }
  }

  const handleToggle = async (id: string, done: boolean) => {
    try {
      await Storage.updateTodo(id, { done })
      setTodos(todos.map((t) => (t.id === id ? { ...t, done } : t)))

      // 完成任务时触发撒花动画
      if (done) {
        fireConfetti()
      }
    } catch (error) {
      toast.error('更新失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await Storage.removeTodo(id)
      setTodos(todos.filter((t) => t.id !== id))
      toast.success('待办已删除')
    } catch (error) {
      toast.error('删除失败')
    }
  }

  const openAddModal = () => {
    setEditingId(null)
    setText('')
    setDateType('today')
    setCustomDate('')
    setReminderEnabled(false)
    setReminderTime('18:00')
    setPriority('low')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
  }

  const getDateLabel = (todo: Todo): string => {
    if (!todo.startDate) return ''
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const date = new Date(todo.startDate)
    date.setHours(0, 0, 0, 0)
    const diffDays = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return '今天'
    if (diffDays === 1) return '明天'
    if (diffDays < 0) return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
    if (diffDays <= 7) {
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      return weekDays[date.getDay()]
    }
    return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
  }

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'high': return 'danger'
      case 'medium': return 'warning'
      default: return 'default'
    }
  }

  // 分离未完成和已完成
  const pendingTodos = todos.filter((t) => !t.done).sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 }
    return (order[a.priority] || 2) - (order[b.priority] || 2)
  })
  const completedTodos = todos.filter((t) => t.done)

  // 今日统计
  const todayStr = formatDate(new Date())
  const todayTodos = todos.filter((t) => t.startDate === todayStr)
  const todayTotal = todayTodos.length
  const todayDone = todayTodos.filter((t) => t.done).length
  const progressValue = todayTotal > 0 ? (todayDone / todayTotal) * 100 : 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" color="primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* 快速添加输入框 + 新增按钮 */}
      <div className="flex items-center gap-2 p-3 border-b border-divider/50">
        <Input
          size="sm"
          placeholder="输入待办，回车添加..."
          value={quickInput}
          onValueChange={setQuickInput}
          onKeyDown={handleQuickInputKeyDown}
          className="flex-1"
        />
        <Button
          size="sm"
          color="primary"
          isIconOnly
          onPress={openAddModal}
          className="min-w-8 h-8 shrink-0"
          title="更多选项"
        >
          <Plus size={16} />
        </Button>
      </div>

      {/* 今日进度条 */}
      <div className="px-3 py-2 border-b border-divider/50">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-default-500">今日进度</span>
          <span className="text-xs text-default-500">{todayDone}/{todayTotal}</span>
        </div>
        <Progress
          size="sm"
          value={progressValue}
          color={progressValue >= 100 ? 'success' : 'primary'}
          className="h-2"
        />
      </div>

      {/* 待办列表 */}
      <div className="flex-1 overflow-y-auto p-3">
        {todos.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-default-400">
              <p className="text-4xl mb-4">✅</p>
              <p className="text-lg font-medium mb-2">暂无待办事项</p>
              <p className="text-sm">输入任务后回车快速添加</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {/* 未完成 */}
            <AnimatePresence mode="popLayout">
              {pendingTodos.map((todo) => (
                <motion.div
                  key={todo.id}
                  layout
                  variants={itemVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 30,
                    mass: 1,
                  }}
                >
                  <Card className="hover:bg-default-50">
                    <CardBody className="p-3 flex-row items-center gap-3">
                      <Checkbox
                        isSelected={todo.done}
                        onValueChange={(checked) => handleToggle(todo.id, checked)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{todo.text}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {todo.priority !== 'low' && (
                            <Chip size="sm" color={getPriorityColor(todo.priority)} variant="flat">
                              {todo.priority === 'high' ? '高' : '中'}
                            </Chip>
                          )}
                          {todo.startDate && (
                            <span className="text-xs text-default-400">{getDateLabel(todo)}</span>
                          )}
                          {todo.reminderEnabled && todo.reminderTime && (
                            <span className="text-xs text-default-400">⏰ {todo.reminderTime}</span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="light"
                        color="danger"
                        isIconOnly
                        onPress={() => handleDelete(todo.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </CardBody>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* 已完成 */}
            {completedTodos.length > 0 && (
              <>
                <p className="text-xs text-default-400 mt-4 mb-2">
                  已完成 ({completedTodos.length})
                </p>
                <AnimatePresence mode="popLayout">
                  {completedTodos.map((todo) => (
                    <motion.div
                      key={todo.id}
                      layout
                      variants={itemVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 30,
                        mass: 1,
                      }}
                    >
                      <Card className="opacity-60">
                        <CardBody className="p-3 flex-row items-center gap-3">
                          <Checkbox
                            isSelected={todo.done}
                            onValueChange={(checked) => handleToggle(todo.id, checked)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm line-through text-default-400">{todo.text}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="light"
                            color="danger"
                            isIconOnly
                            onPress={() => handleDelete(todo.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </CardBody>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </>
            )}
          </div>
        )}
      </div>

      {/* 添加弹窗（更多选项） */}
      <Modal isOpen={isModalOpen} onClose={closeModal} placement="center">
        <ModalContent>
          <ModalHeader>添加待办</ModalHeader>
          <ModalBody className="gap-4">
            <Input
              label="任务内容"
              placeholder="输入待办事项"
              value={text}
              onValueChange={setText}
            />

            <RadioGroup
              label="日期"
              orientation="horizontal"
              value={dateType}
              onValueChange={setDateType}
              size="sm"
            >
              <Radio value="today">今天</Radio>
              <Radio value="tomorrow">明天</Radio>
              <Radio value="thisweek">本周</Radio>
              <Radio value="other">其他</Radio>
            </RadioGroup>

            {dateType === 'other' && (
              <Input
                type="date"
                value={customDate}
                onValueChange={setCustomDate}
              />
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm">提醒</span>
              <Switch
                isSelected={reminderEnabled}
                onValueChange={setReminderEnabled}
                size="sm"
              />
            </div>

            {reminderEnabled && (
              <Input
                type="time"
                value={reminderTime}
                onValueChange={setReminderTime}
              />
            )}

            <RadioGroup
              label="优先级"
              orientation="horizontal"
              value={priority}
              onValueChange={setPriority}
              size="sm"
            >
              <Radio value="low">低</Radio>
              <Radio value="medium">中</Radio>
              <Radio value="high">高</Radio>
            </RadioGroup>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={closeModal}>
              取消
            </Button>
            <Button color="primary" onPress={handleSave}>
              添加
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}

/**
 * AG.NEXUS - 提示词面板
 */

import { useState, useEffect } from 'react'
import {
  Button,
  Input,
  Card,
  CardBody,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Spinner,
  Textarea,
  Chip,
  Select,
  SelectItem,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@heroui/react'
import {
  Plus,
  Search,
  Copy,
  Check,
  Trash2,
  Code2,
  UserCircle,
  Image,
  FileText,
  Video,
  Sparkles,
  X,
  Tag,
} from 'lucide-react'
import { Storage } from '../../services/storage'
import type { Prompt, PromptCategory } from '../../services/types'
import toast from 'react-hot-toast'

// 分类图标映射
const categoryIcons: Record<string, any> = {
  programming: Code2,
  role: UserCircle,
  image: Image,
  copywriting: FileText,
  video: Video,
}

// 分类渐变色映射
const categoryGradients: Record<string, string> = {
  programming: 'from-blue-500 to-cyan-500',
  role: 'from-purple-500 to-pink-500',
  image: 'from-amber-400 to-orange-500',
  copywriting: 'from-emerald-500 to-teal-500',
  video: 'from-rose-500 to-red-500',
}

export function PromptPanel() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [categories, setCategories] = useState<PromptCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('programming')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [promptsData, categoriesData] = await Promise.all([
        Storage.getPrompts(),
        Storage.getPromptCategories(),
      ])
      setPrompts(promptsData)
      setCategories(categoriesData)
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('请填写标题和内容')
      return
    }

    const tagsArray = tags.trim() ? tags.trim().split(/\s+/).filter((t) => t) : []

    try {
      if (editingId) {
        await Storage.updatePrompt(editingId, {
          title: title.trim(),
          tags: tagsArray,
          content: content.trim(),
          category,
        })
        setPrompts(
          prompts.map((p) =>
            p.id === editingId
              ? { ...p, title: title.trim(), tags: tagsArray, content: content.trim(), category }
              : p
          )
        )
        toast.success('提示词已更新')
      } else {
        const newPrompt = await Storage.addPrompt({
          title: title.trim(),
          tags: tagsArray,
          content: content.trim(),
          category,
        })
        setPrompts([...prompts, newPrompt])
        toast.success('提示词已添加')
      }
      closeModal()
    } catch (error) {
      toast.error('保存失败')
    }
  }

  const handleDelete = async () => {
    if (!editingId) return
    try {
      await Storage.removePrompt(editingId)
      setPrompts(prompts.filter((p) => p.id !== editingId))
      toast.success('提示词已删除')
      closeModal()
    } catch (error) {
      toast.error('删除失败')
    }
  }

  const handleCopy = async (prompt: Prompt, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(prompt.content)
      setCopiedId(prompt.id)
      toast.success('已复制提示词')
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      toast.error('复制失败')
    }
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return
    try {
      const newCategory = await Storage.addPromptCategory(newCategoryName.trim())
      setCategories([...categories, newCategory])
      setNewCategoryName('')
      setIsAddCategoryOpen(false)
      toast.success('分类已添加')
    } catch (error) {
      toast.error('添加分类失败')
    }
  }

  const handleDeleteCategory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await Storage.removePromptCategory(id)
      setCategories(categories.filter((c) => c.id !== id))
      if (selectedCategory === id) {
        setSelectedCategory(null)
      }
      toast.success('分类已删除')
    } catch (error) {
      toast.error('默认分类不可删除')
    }
  }

  const openEditModal = (prompt: Prompt) => {
    setEditingId(prompt.id)
    setTitle(prompt.title)
    setTags(prompt.tags.join(' '))
    setContent(prompt.content)
    setCategory(prompt.category || 'programming')
    setIsModalOpen(true)
  }

  const openAddModal = () => {
    setEditingId(null)
    setTitle('')
    setTags('')
    setContent('')
    setCategory('programming')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setTitle('')
    setTags('')
    setContent('')
    setCategory('programming')
  }

  // 获取分类图标
  const getCategoryIcon = (categoryId: string) => {
    return categoryIcons[categoryId] || Sparkles
  }

  // 获取分类名称
  const getCategoryName = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId)
    return cat?.name || '未分类'
  }

  // 获取分类渐变色
  const getCategoryGradient = (categoryId: string) => {
    return categoryGradients[categoryId] || 'from-indigo-500 to-violet-500'
  }

  // 过滤提示词
  const filteredPrompts = prompts.filter((p) => {
    const matchesSearch = !searchKeyword ||
      p.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      p.content.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      p.tags.some((tag) => tag.toLowerCase().includes(searchKeyword.toLowerCase()))

    const matchesCategory = !selectedCategory || p.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" color="primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900">
      {/* 搜索栏 + 添加按钮 */}
      <div className="flex items-center gap-2 p-3 border-b border-divider/50">
        <Input
          size="sm"
          placeholder="搜索提示词..."
          value={searchKeyword}
          onValueChange={setSearchKeyword}
          startContent={<Search size={14} className="text-default-400" />}
          isClearable
          onClear={() => setSearchKeyword('')}
          className="flex-1"
        />
        <Button
          size="sm"
          color="primary"
          isIconOnly
          onPress={openAddModal}
          className="min-w-8 h-8 shrink-0"
        >
          <Plus size={16} />
        </Button>
      </div>

      {/* 分类胶囊区域 */}
      <div className="flex flex-wrap gap-1.5 p-3 border-b border-divider/50">
        <Chip
          size="sm"
          variant={selectedCategory === null ? 'solid' : 'flat'}
          color={selectedCategory === null ? 'primary' : 'default'}
          className="cursor-pointer"
          onClick={() => setSelectedCategory(null)}
        >
          全部
        </Chip>
        {categories.map((cat) => {
          const Icon = getCategoryIcon(cat.id)
          return (
            <Chip
              key={cat.id}
              size="sm"
              variant={selectedCategory === cat.id ? 'solid' : 'flat'}
              color={selectedCategory === cat.id ? 'primary' : 'default'}
              className="cursor-pointer group"
              onClick={() => setSelectedCategory(cat.id)}
              startContent={<Icon size={12} />}
              endContent={
                !cat.isDefault && (
                  <button
                    className="opacity-0 group-hover:opacity-100 ml-0.5 hover:text-danger transition-opacity"
                    onClick={(e) => handleDeleteCategory(cat.id, e)}
                  >
                    <X size={12} />
                  </button>
                )
              }
            >
              {cat.name}
            </Chip>
          )
        })}
        <Popover
          isOpen={isAddCategoryOpen}
          onOpenChange={setIsAddCategoryOpen}
          placement="bottom"
        >
          <PopoverTrigger>
            <Chip
              size="sm"
              variant="flat"
              color="default"
              className="cursor-pointer"
              startContent={<Plus size={12} />}
            >
              新增
            </Chip>
          </PopoverTrigger>
          <PopoverContent className="p-2">
            <div className="flex gap-2">
              <Input
                size="sm"
                placeholder="分类名称"
                value={newCategoryName}
                onValueChange={setNewCategoryName}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                className="w-32"
              />
              <Button size="sm" color="primary" onPress={handleAddCategory}>
                添加
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* 提示词列表 */}
      <div className="flex-1 overflow-y-auto p-3">
        {filteredPrompts.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-default-400">
              <p className="text-4xl mb-4">💡</p>
              <p className="text-lg font-medium mb-2">
                {searchKeyword || selectedCategory ? '没有找到匹配的提示词' : '暂无提示词'}
              </p>
              <p className="text-sm">点击右上角 + 添加 AI 提示词模板</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPrompts.map((prompt) => {
              const gradient = getCategoryGradient(prompt.category)
              return (
                <Card
                  key={prompt.id}
                  isPressable
                  onPress={() => openEditModal(prompt)}
                  className="border-none bg-background/60 dark:bg-default-100/50 backdrop-blur-md shadow-sm hover:shadow-md transition-all group"
                >
                  <CardBody className="flex flex-row gap-3 p-3 items-center overflow-hidden">
                    {/* 左侧：渐变封面 */}
                    <div
                      className={`shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-base shadow-lg`}
                    >
                      {prompt.title.slice(0, 2)}
                    </div>

                    {/* 右侧：内容区域 */}
                    <div className="flex flex-col flex-1 min-w-0 gap-1">
                      {/* 标题 + 标签 */}
                      <div className="flex flex-col gap-0.5">
                        <h3 className="font-bold text-sm text-foreground truncate pr-6">
                          {prompt.title}
                        </h3>
                        <div className="flex gap-1 flex-wrap">
                          {prompt.tags.length > 0 ? (
                            prompt.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] text-default-500 bg-default-100 px-1.5 rounded flex items-center gap-0.5"
                              >
                                <Tag size={8} /> {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-default-400">
                              {getCategoryName(prompt.category)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 提示词预览 */}
                      <p className="text-xs text-default-400 line-clamp-2 leading-relaxed">
                        {prompt.content}
                      </p>
                    </div>

                    {/* 复制按钮 */}
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color={copiedId === prompt.id ? 'success' : 'default'}
                      className="absolute top-2 right-2 text-default-400 opacity-0 group-hover:opacity-100 transition-all min-w-7 h-7"
                      onPress={(e: any) => handleCopy(prompt, e)}
                    >
                      {copiedId === prompt.id ? <Check size={14} /> : <Copy size={14} />}
                    </Button>
                  </CardBody>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* 添加/编辑弹窗 */}
      <Modal isOpen={isModalOpen} onClose={closeModal} placement="center" size="lg">
        <ModalContent>
          <ModalHeader>{editingId ? '编辑提示词' : '添加提示词'}</ModalHeader>
          <ModalBody>
            <Input
              label="标题"
              placeholder="输入提示词标题"
              value={title}
              onValueChange={setTitle}
            />
            <Select
              label="分类"
              placeholder="选择分类"
              selectedKeys={[category]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string
                if (selected) setCategory(selected)
              }}
            >
              {categories.map((cat) => (
                <SelectItem key={cat.id}>{cat.name}</SelectItem>
              ))}
            </Select>
            <Input
              label="标签"
              placeholder="用空格分隔多个标签（可选）"
              value={tags}
              onValueChange={setTags}
            />
            <Textarea
              label="内容"
              placeholder="输入提示词内容"
              value={content}
              onValueChange={setContent}
              minRows={5}
            />
          </ModalBody>
          <ModalFooter>
            {editingId && (
              <Button
                color="danger"
                variant="light"
                onPress={handleDelete}
                startContent={<Trash2 size={14} />}
              >
                删除
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="light" onPress={closeModal}>
              取消
            </Button>
            <Button color="primary" onPress={handleSave}>
              保存
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}

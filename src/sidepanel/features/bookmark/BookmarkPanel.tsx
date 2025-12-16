/**
 * AG.NEXUS - 收藏面板
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
  Pagination,
  Avatar,
} from '@heroui/react'
import { Plus, Search, Trash2, ExternalLink, BookMarked } from 'lucide-react'
import { Storage } from '../../services/storage'
import type { Bookmark } from '../../services/types'
import toast from 'react-hot-toast'

const PAGE_SIZE = 5

export function BookmarkPanel() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 表单状态
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    loadBookmarks()
  }, [])

  const loadBookmarks = async () => {
    try {
      const data = await Storage.getBookmarks()
      setBookmarks(data)
    } catch (error) {
      console.error('加载收藏失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!title.trim() || !url.trim()) {
      toast.error('请填写标题和网址')
      return
    }

    // 自动补全协议
    let finalUrl = url.trim()
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl
    }

    // 验证 URL 格式
    try {
      new URL(finalUrl)
    } catch {
      toast.error('网址格式不正确')
      return
    }

    try {
      const newBookmark = await Storage.addBookmark({
        title: title.trim(),
        url: finalUrl,
        description: description.trim(),
      })
      setBookmarks([newBookmark, ...bookmarks])
      setCurrentPage(1)
      toast.success('收藏已添加')
      closeModal()
    } catch (error) {
      toast.error('添加失败')
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await Storage.removeBookmark(id)
      setBookmarks(bookmarks.filter((b) => b.id !== id))
      toast.success('收藏已删除')
    } catch (error) {
      toast.error('删除失败')
    }
  }

  const handleOpen = (bookmark: Bookmark) => {
    window.open(bookmark.url, '_blank')
  }

  const openAddModal = () => {
    setTitle('')
    setUrl('')
    setDescription('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  // 过滤收藏
  const filteredBookmarks = searchKeyword
    ? bookmarks.filter(
        (b) =>
          b.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          b.url.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          (b.description && b.description.toLowerCase().includes(searchKeyword.toLowerCase()))
      )
    : bookmarks

  // 分页
  const totalPages = Math.ceil(filteredBookmarks.length / PAGE_SIZE)
  const paginatedBookmarks = filteredBookmarks.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  // 搜索时重置到第一页
  useEffect(() => {
    setCurrentPage(1)
  }, [searchKeyword])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" color="primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between p-2 border-b border-divider/50">
        <div className="flex items-center gap-2">
          <Avatar
            radius="lg"
            size="sm"
            classNames={{
              base: 'bg-primary/10',
              icon: 'text-primary',
            }}
            icon={<BookMarked size={16} />}
          />
          <span className="text-sm font-medium">我的收藏</span>
        </div>
        <Button
          size="sm"
          color="primary"
          isIconOnly
          onPress={openAddModal}
          title="添加收藏"
        >
          <Plus size={16} />
        </Button>
      </div>

      {/* 搜索栏 */}
      <div className="p-2 border-b border-divider/50">
        <Input
          size="sm"
          placeholder="搜索收藏..."
          value={searchKeyword}
          onValueChange={setSearchKeyword}
          startContent={<Search size={14} className="text-default-400" />}
          isClearable
          onClear={() => setSearchKeyword('')}
        />
      </div>

      {/* 收藏列表 */}
      <div className="flex-1 overflow-y-auto p-3">
        {filteredBookmarks.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-default-400">
              <p className="text-4xl mb-4">📑</p>
              <p className="text-lg font-medium mb-2">
                {searchKeyword ? '没有找到匹配的收藏' : '暂无收藏'}
              </p>
              {!searchKeyword && (
                <div className="text-sm space-y-1 mt-4">
                  <p className="font-medium text-default-500">功能说明:</p>
                  <p>收藏优质文章和资源</p>
                  <p>支持关键字搜索和分页</p>
                  <p className="mt-3 font-medium text-default-500">使用方式:</p>
                  <p>点击右上角 + 添加收藏</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {paginatedBookmarks.map((bookmark) => (
              <Card
                key={bookmark.id}
                isPressable
                onPress={() => handleOpen(bookmark)}
                className="hover:bg-default-100"
              >
                <CardBody className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{bookmark.title}</p>
                        <ExternalLink size={12} className="text-default-400 flex-shrink-0" />
                      </div>
                      {bookmark.description && (
                        <p className="text-xs text-default-400 mt-1 truncate">
                          {bookmark.description}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="light"
                      color="danger"
                      isIconOnly
                      onPress={(e: any) => handleDelete(bookmark.id, e)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex justify-center p-2 border-t border-divider/50">
          <Pagination
            size="sm"
            total={totalPages}
            page={currentPage}
            onChange={setCurrentPage}
            showControls
          />
        </div>
      )}

      {/* 添加弹窗 */}
      <Modal isOpen={isModalOpen} onClose={closeModal} placement="center">
        <ModalContent>
          <ModalHeader>添加收藏</ModalHeader>
          <ModalBody className="gap-4">
            <Input
              label="标题"
              placeholder="输入收藏标题"
              value={title}
              onValueChange={setTitle}
            />
            <Input
              label="网址"
              placeholder="输入网址 (如: example.com)"
              value={url}
              onValueChange={setUrl}
            />
            <Textarea
              label="描述"
              placeholder="输入描述 (可选)"
              value={description}
              onValueChange={setDescription}
              minRows={2}
            />
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

/**
 * AG.NEXUS - 导航面板
 * 合并导航和收藏功能
 */

import { useState, useEffect } from 'react'
import {
  Button,
  Spinner,
  Tabs,
  Tab,
  Input,
  Card,
  CardBody,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
  Pagination,
  Link,
} from '@heroui/react'
import { Plus, Compass, BookMarked, Search, Trash2, ExternalLink } from 'lucide-react'
import { useNavigation } from '../../hooks/useNavigation'
import { NavigationCard } from './NavigationCard'
import { AddNavigationModal } from './AddNavigationModal'
import { Storage } from '../../services/storage'
import type { Bookmark } from '../../services/types'
import toast from 'react-hot-toast'

const PAGE_SIZE = 5

export function NavigationPanel() {
  const { navs, isLoading: navsLoading, addNav, removeNav } = useNavigation()
  const [isNavModalOpen, setIsNavModalOpen] = useState(false)
  const [activeSubTab, setActiveSubTab] = useState<'nav' | 'bookmark'>('nav')

  // 收藏相关状态
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [isBookmarksLoading, setIsBookmarksLoading] = useState(true)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false)

  // 收藏表单状态
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')

  // 加载收藏数据
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
      setIsBookmarksLoading(false)
    }
  }

  // 收藏相关方法
  const handleSaveBookmark = async () => {
    if (!title.trim() || !url.trim()) {
      toast.error('请填写标题和网址')
      return
    }

    let finalUrl = url.trim()
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl
    }

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
      closeBookmarkModal()
    } catch (error) {
      toast.error('添加失败')
    }
  }

  const handleDeleteBookmark = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await Storage.removeBookmark(id)
      setBookmarks(bookmarks.filter((b) => b.id !== id))
      toast.success('收藏已删除')
    } catch (error) {
      toast.error('删除失败')
    }
  }

  const handleOpenBookmark = (bookmark: Bookmark) => {
    window.open(bookmark.url, '_blank')
  }

  const openBookmarkModal = () => {
    setTitle('')
    setUrl('')
    setDescription('')
    setIsBookmarkModalOpen(true)
  }

  const closeBookmarkModal = () => {
    setIsBookmarkModalOpen(false)
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

  const isLoading = activeSubTab === 'nav' ? navsLoading : isBookmarksLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" color="primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* 顶部 Tab 切换 + 添加按钮 */}
      <div className="flex items-center justify-between p-2 border-b border-divider/50">
        <Tabs
          aria-label="导航类型"
          selectedKey={activeSubTab}
          onSelectionChange={(key) => setActiveSubTab(key as 'nav' | 'bookmark')}
          variant="underlined"
          color="primary"
          size="sm"
          classNames={{
            tabList: 'gap-4',
            tab: 'h-8 px-0',
          }}
        >
          <Tab
            key="nav"
            title={
              <div className="flex items-center space-x-1.5">
                <Compass size={14} />
                <span>导航</span>
              </div>
            }
          />
          <Tab
            key="bookmark"
            title={
              <div className="flex items-center space-x-1.5">
                <BookMarked size={14} />
                <span>收藏</span>
              </div>
            }
          />
        </Tabs>
        <Button
          size="sm"
          color="primary"
          isIconOnly
          onPress={() => activeSubTab === 'nav' ? setIsNavModalOpen(true) : openBookmarkModal()}
          title={activeSubTab === 'nav' ? '添加导航' : '添加收藏'}
          className="min-w-8 h-8"
        >
          <Plus size={16} />
        </Button>
      </div>

      {/* 导航内容 */}
      {activeSubTab === 'nav' && (
        <div className="flex-1 overflow-y-auto p-4">
          {navs.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-default-400">
                <p className="text-4xl mb-4">🧭</p>
                <p className="text-lg font-medium mb-2">暂无导航</p>
                <p className="text-sm">点击右上角 + 添加常用网站</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {navs.map((nav) => (
                <NavigationCard key={nav.id} nav={nav} onRemove={removeNav} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 收藏内容 */}
      {activeSubTab === 'bookmark' && (
        <>
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
                    <p className="text-sm">点击右上角 + 添加收藏</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {paginatedBookmarks.map((bookmark) => (
                  <Card
                    key={bookmark.id}
                    isPressable
                    onPress={() => handleOpenBookmark(bookmark)}
                    className="hover:bg-default-100"
                  >
                    <CardBody className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <ExternalLink size={14} className="text-primary flex-shrink-0" />
                            <Link
                              href={bookmark.url}
                              isExternal
                              showAnchorIcon={false}
                              className="text-sm font-medium truncate text-foreground"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {bookmark.title}
                            </Link>
                          </div>
                          {bookmark.description && (
                            <p className="text-xs text-default-400 mt-1 truncate pl-6">
                              {bookmark.description}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="light"
                          color="danger"
                          isIconOnly
                          onPress={(e: any) => handleDeleteBookmark(bookmark.id, e)}
                          className="min-w-7 h-7"
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
        </>
      )}

      {/* 添加导航弹窗 */}
      <AddNavigationModal
        isOpen={isNavModalOpen}
        onClose={() => setIsNavModalOpen(false)}
        onAdd={addNav}
      />

      {/* 添加收藏弹窗 */}
      <Modal isOpen={isBookmarkModalOpen} onClose={closeBookmarkModal} placement="center">
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
            <Button variant="light" onPress={closeBookmarkModal}>
              取消
            </Button>
            <Button color="primary" onPress={handleSaveBookmark}>
              添加
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}

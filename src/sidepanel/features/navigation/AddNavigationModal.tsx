/**
 * AG.NEXUS - 添加导航弹窗
 */

import { useState } from 'react'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
} from '@heroui/react'
import type { NavInput } from '../../services/types'

interface AddNavigationModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (input: NavInput) => Promise<any>
}

export function AddNavigationModal({
  isOpen,
  onClose,
  onAdd,
}: AddNavigationModalProps) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    if (!url.trim()) return

    setIsLoading(true)
    try {
      await onAdd({ title: title.trim(), url: url.trim() })
      setTitle('')
      setUrl('')
      onClose()
    } catch (error) {
      // 错误已在 hook 中处理
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setTitle('')
      setUrl('')
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} placement="center">
      <ModalContent>
        <ModalHeader>添加导航</ModalHeader>
        <ModalBody>
          <Input
            label="标题"
            placeholder="留空自动提取域名"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isLoading}
          />
          <Input
            label="网址"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading}
            isRequired
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={handleClose} disabled={isLoading}>
            取消
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={isLoading}
            isDisabled={!url.trim()}
          >
            添加
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

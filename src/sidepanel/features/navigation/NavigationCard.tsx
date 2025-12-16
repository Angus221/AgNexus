/**
 * AG.NEXUS - 导航卡片组件
 */

import { Card, CardBody, Button } from '@heroui/react'
import { X } from 'lucide-react'
import type { Nav } from '../../services/types'

interface NavigationCardProps {
  nav: Nav
  onRemove: (id: string) => void
}

export function NavigationCard({ nav, onRemove }: NavigationCardProps) {
  const handleClick = () => {
    window.open(nav.url, '_blank')
  }

  const handleRemove = () => {
    if (confirm(`确定要删除"${nav.title}"吗？`)) {
      onRemove(nav.id)
    }
  }

  return (
    <Card
      isPressable
      onPress={handleClick}
      className="relative group hover:scale-105 transition-transform"
    >
      <CardBody className="p-3 flex flex-col items-center justify-center gap-2">
        {/* Favicon */}
        <div className="w-10 h-10 flex items-center justify-center">
          {nav.favicon ? (
            <img
              src={nav.favicon}
              alt={nav.title}
              className="w-8 h-8 rounded"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center text-primary font-bold">
              {nav.title.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* 标题 */}
        <p className="text-sm font-medium text-center line-clamp-2 w-full">
          {nav.title}
        </p>

        {/* 删除按钮 */}
        <Button
          isIconOnly
          size="sm"
          variant="flat"
          color="danger"
          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onPress={handleRemove}
        >
          <X size={14} />
        </Button>
      </CardBody>
    </Card>
  )
}

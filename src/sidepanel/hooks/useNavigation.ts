/**
 * AG.NEXUS - 导航 Hook
 */

import { useState, useEffect } from 'react'
import { Storage } from '../services/storage'
import type { Nav, NavInput } from '../services/types'
import toast from 'react-hot-toast'

export function useNavigation() {
  const [navs, setNavs] = useState<Nav[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 加载导航列表
  useEffect(() => {
    const loadNavs = async () => {
      try {
        const data = await Storage.getNavs()
        setNavs(data)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        toast.error(`加载导航失败: ${message}`)
      } finally {
        setIsLoading(false)
      }
    }
    loadNavs()
  }, [])

  // 添加导航
  const addNav = async (input: NavInput) => {
    try {
      const newNav = await Storage.addNav(input)
      setNavs((prev) => [...prev, newNav])
      toast.success('导航已添加')
      return newNav
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      toast.error(`添加失败: ${message}`)
      throw error
    }
  }

  // 删除导航
  const removeNav = async (id: string) => {
    try {
      await Storage.removeNav(id)
      setNavs((prev) => prev.filter((n) => n.id !== id))
      toast.success('导航已删除')
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      toast.error(`删除失败: ${message}`)
      throw error
    }
  }

  return {
    navs,
    isLoading,
    addNav,
    removeNav,
  }
}

/**
 * AG.NEXUS - 标签页 Context
 * 管理当前激活的标签页状态
 */

import { createContext, useContext, useState, ReactNode } from 'react'

/**
 * 标签页类型定义
 */
export type TabType =
  | 'assistant'
  | 'navigation'
  | 'command'
  | 'prompt'
  | 'todo'
  | 'vault'
  | 'settings'

/**
 * Tab Context 值类型
 */
interface TabContextValue {
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
}

/**
 * 创建 Context
 */
const TabContext = createContext<TabContextValue | undefined>(undefined)

/**
 * TabProvider 组件
 */
interface TabProviderProps {
  children: ReactNode
}

export function TabProvider({ children }: TabProviderProps) {
  const [activeTab, setActiveTab] = useState<TabType>('assistant')

  return (
    <TabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabContext.Provider>
  )
}

/**
 * useTab Hook
 */
export function useTab() {
  const context = useContext(TabContext)
  if (context === undefined) {
    throw new Error('useTab must be used within a TabProvider')
  }
  return context
}

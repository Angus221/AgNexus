/**
 * AG.NEXUS - 主应用组件
 */

import { Toaster } from 'react-hot-toast'
import { Tabs, Tab, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button, Avatar } from '@heroui/react'
import {
  Navigation,
  SquareTerminal,
  MessageSquareText,
  ListChecks,
  Lock,
  Settings,
  MoreHorizontal,
} from 'lucide-react'
import { TabProvider, useTab, type TabType } from './contexts/TabContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { AssistantPanel } from './features/assistant/AssistantPanel'
import { NavigationPanel } from './features/navigation/NavigationPanel'
import { CommandPanel } from './features/command/CommandPanel'
import { PromptPanel } from './features/prompt/PromptPanel'
import { TodoPanel } from './features/todo/TodoPanel'
import { VaultPanel } from './features/vault/VaultPanel'
import { SettingsPanel } from './features/settings/SettingsPanel'

/**
 * 主内容区域
 */
function AppContent() {
  const { activeTab, setActiveTab } = useTab()

  // 更多功能（收起在下拉菜单中）
  const moreFeatures: Array<{ key: TabType; icon: any; label: string }> = [
    { key: 'vault', icon: Lock, label: '保险库' },
    { key: 'settings', icon: Settings, label: '设置' },
  ]

  // 检查当前 tab 是否在更多菜单中
  const isMoreTabActive = moreFeatures.some(f => f.key === activeTab)

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-50 border-b border-divider/40 bg-background/80 backdrop-blur-md px-2 py-2">
        <div className="flex items-center justify-between">
          {/* Tabs 导航 */}
          <Tabs
            aria-label="导航"
            selectedKey={isMoreTabActive ? 'none' : activeTab}
            onSelectionChange={(key) => {
              if (key && key !== 'none') {
                setActiveTab(key as TabType)
              }
            }}
            variant="bordered"
            color="primary"
            size="sm"
            classNames={{
              tabList: 'gap-1',
              tab: 'h-8 px-2',
              tabContent: 'group-data-[selected=true]:text-primary-foreground',
            }}
          >
            <Tab
              key="assistant"
              title={
                <div className="flex items-center space-x-1.5">
                  <Avatar src="/icons/icon128.png" className="w-4 h-4" />
                  <span>助理</span>
                </div>
              }
            />
            <Tab
              key="navigation"
              title={
                <div className="flex items-center space-x-1.5">
                  <Navigation size={14} fill="currentColor" />
                  <span>导航</span>
                </div>
              }
            />
            <Tab
              key="command"
              title={
                <div className="flex items-center space-x-1.5">
                  <SquareTerminal size={14} />
                  <span>指令</span>
                </div>
              }
            />
            <Tab
              key="prompt"
              title={
                <div className="flex items-center space-x-1.5">
                  <MessageSquareText size={14} />
                  <span>提示</span>
                </div>
              }
            />
            <Tab
              key="todo"
              title={
                <div className="flex items-center space-x-1.5">
                  <ListChecks size={14} />
                  <span>待办</span>
                </div>
              }
            />
          </Tabs>

          {/* 更多菜单 */}
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button
                variant={isMoreTabActive ? 'flat' : 'light'}
                color={isMoreTabActive ? 'primary' : 'default'}
                size="sm"
                isIconOnly
                className="min-w-8 h-8"
              >
                <MoreHorizontal size={16} />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="更多功能">
              {moreFeatures.map((feature) => {
                const Icon = feature.icon
                return (
                  <DropdownItem
                    key={feature.key}
                    startContent={<Icon size={16} />}
                    onPress={() => setActiveTab(feature.key)}
                  >
                    {feature.label}
                  </DropdownItem>
                )
              })}
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'assistant' && <AssistantPanel />}
        {activeTab === 'navigation' && <NavigationPanel />}
        {activeTab === 'command' && <CommandPanel />}
        {activeTab === 'prompt' && <PromptPanel />}
        {activeTab === 'todo' && <TodoPanel />}
        {activeTab === 'vault' && <VaultPanel />}
        {activeTab === 'settings' && <SettingsPanel />}
      </div>
    </div>
  )
}

/**
 * 主应用
 */
function App() {
  return (
    <ThemeProvider>
      <TabProvider>
        <AppContent />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'var(--heroui-colors-background)',
              color: 'var(--heroui-colors-foreground)',
              border: '1px solid var(--heroui-colors-divider)',
            },
          }}
        />
      </TabProvider>
    </ThemeProvider>
  )
}

export default App

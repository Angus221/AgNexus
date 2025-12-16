/**
 * AG.NEXUS - 设置面板
 */

import { useState, useEffect } from 'react'
import {
  Card,
  CardBody,
  Input,
  Switch,
  Button,
  Divider,
  Select,
  SelectItem,
  Avatar,
  Textarea,
} from '@heroui/react'
import { Save, Download, Upload,
  Eye,
  EyeOff,
  Settings as SettingsIcon,
  Plus,
  Trash2,
  Rss,
} from 'lucide-react'
import { Storage } from '../../services/storage'
import type { Settings, RssSource } from '../../services/types'
import toast from 'react-hot-toast'

export function SettingsPanel() {
  const [settings, setSettings] = useState<Settings>({
    apiUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: '',
    model: 'qwen-turbo',
    visionModel: 'qwen3-vl-flash',
    theme: 'auto',
    floatBallEnabled: true,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [showApiKey, setShowApiKey] = useState(false)
  const [includeSecrets, setIncludeSecrets] = useState(false)
  const [rssSources, setRssSources] = useState<RssSource[]>([])
  const [newRssUrl, setNewRssUrl] = useState('')
  const [isAddingRss, setIsAddingRss] = useState(false)

  // 模型选项
  const modelOptions = [
    { key: 'qwen-turbo', label: 'Qwen Turbo (快速)' },
    { key: 'qwen-plus', label: 'Qwen Plus (均衡)' },
    { key: 'qwen-max', label: 'Qwen Max (强力)' },
    { key: 'qwen-long', label: 'Qwen Long (长文本)' },
    { key: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { key: 'gpt-4o', label: 'GPT-4o' },
  ]

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const data = await Storage.getSettings()
      setSettings(data)
      const rss = await Storage.getRssSources()
      setRssSources(rss || [])
    } catch (error) {
      console.error('加载设置失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddRss = async () => {
    if (!newRssUrl) return
    setIsAddingRss(true)
    try {
      // 简单的 RSS 验证逻辑，实际可能需要 fetch 验证
      // 这里我们先添加，后续让 Agent 去处理解析
      const newSource: Omit<RssSource, 'id'> = {
        title: 'New Feed', // 暂时用默认标题，后续可以解析获取
        url: newRssUrl,
        description: 'RSS Feed',
        enabled: true,
      }
      const added = await Storage.addRssSource(newSource)
      setRssSources([added, ...rssSources])
      setNewRssUrl('')
      toast.success('RSS 源已添加')
    } catch (error) {
      toast.error('添加失败')
    } finally {
      setIsAddingRss(false)
    }
  }

  const handleRemoveRss = async (id: string) => {
    try {
      await Storage.removeRssSource(id)
      setRssSources(rssSources.filter(s => s.id !== id))
      toast.success('RSS 源已删除')
    } catch (error) {
      toast.error('删除失败')
    }
  }

  const handleSave = async () => {
    try {
      await Storage.updateSettings(settings)

      // 通知 background 更新悬浮球状态
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({
          type: 'UPDATE_FLOAT_BALL',
          enabled: settings.floatBallEnabled,
        })
      }

      toast.success('设置已保存')
    } catch (error) {
      toast.error('保存失败')
    }
  }

  const handleExport = async () => {
    try {
      const data = await Storage.exportData({ includeSecrets })
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const suffix = includeSecrets ? '-full' : ''
      a.download = `ag-nexus-backup${suffix}-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('数据已导出')
    } catch (error) {
      toast.error('导出失败')
    }
  }

  const handleImport = async (file: File) => {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await Storage.importData(data)
      await loadSettings()
      toast.success('数据已导入')
    } catch (error) {
      toast.error('导入失败：文件格式错误')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-default-400">加载中...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* 顶部标题栏 */}
      <div className="flex items-center p-2 border-b border-divider/50">
        <div className="flex items-center gap-2">
          <Avatar
            radius="lg"
            size="sm"
            classNames={{
              base: 'bg-primary/10',
              icon: 'text-primary',
            }}
            icon={<SettingsIcon size={16} />}
          />
          <span className="text-sm font-medium">设置</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-md mx-auto space-y-4">
        {/* API 配置 */}
        <Card>
          <CardBody className="gap-4">
            <h3 className="text-sm font-semibold text-default-700">API 配置</h3>

            <Input
              label="API 地址"
              placeholder="输入 API 地址"
              value={settings.apiUrl}
              onValueChange={(value) =>
                setSettings({ ...settings, apiUrl: value })
              }
              size="sm"
            />

            <Input
              label="API Key"
              placeholder="输入 API Key"
              value={settings.apiKey}
              onValueChange={(value) =>
                setSettings({ ...settings, apiKey: value })
              }
              type={showApiKey ? 'text' : 'password'}
              size="sm"
              endContent={
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="text-default-400 hover:text-default-600"
                >
                  {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            <Select
              label="模型"
              placeholder="选择模型"
              selectedKeys={[settings.model]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string
                if (selected) {
                  setSettings({ ...settings, model: selected })
                }
              }}
              size="sm"
            >
              {modelOptions.map((option) => (
                <SelectItem key={option.key}>{option.label}</SelectItem>
              ))}
            </Select>

            <Input
              label="视觉模型"
              placeholder="输入视觉模型名称 (如 qwen3-vl-flash)"
              value={settings.visionModel}
              onValueChange={(value) =>
                setSettings({ ...settings, visionModel: value })
              }
              size="sm"
            />
          </CardBody>
        </Card>

        {/* RSS 配置 */}
        <Card>
          <CardBody className="gap-4">
            <h3 className="text-sm font-semibold text-default-700 flex items-center gap-2">
              <Rss size={16} />
              早报 RSS 源
            </h3>
            <div className="flex gap-2">
              <Input
                placeholder="输入 RSS 订阅地址"
                value={newRssUrl}
                onValueChange={setNewRssUrl}
                size="sm"
              />
              <Button isIconOnly size="sm" color="primary" onClick={handleAddRss} isLoading={isAddingRss}>
                <Plus size={16} />
              </Button>
            </div>
            <div className="space-y-2">
              {rssSources.map(source => (
                <div key={source.id} className="flex items-center justify-between p-2 bg-default-50 rounded-lg text-sm">
                  <div className="truncate flex-1 mr-2">
                    <div className="font-medium truncate">{source.title}</div>
                    <div className="text-xs text-default-400 truncate">{source.url}</div>
                  </div>
                  <Button isIconOnly size="sm" variant="light" color="danger" onClick={() => handleRemoveRss(source.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
              {rssSources.length === 0 && (
                <div className="text-center text-xs text-default-400 py-2">暂无订阅源</div>
              )}
            </div>
            
            <Divider />
            
            <Textarea
              label="自定义早报提示词"
              placeholder="补充给 AI 的额外指示，例如：'多关注科技新闻' 或 '用幽默的风格'"
              value={settings.morningReportPrompt || ''}
              onValueChange={(value) =>
                setSettings({ ...settings, morningReportPrompt: value })
              }
              minRows={2}
              size="sm"
            />
          </CardBody>
        </Card>

        {/* 功能设置 */}
        <Card>
          <CardBody className="gap-4">
            <h3 className="text-sm font-semibold text-default-700">功能设置</h3>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">悬浮球</p>
                <p className="text-xs text-default-400">在网页中显示悬浮球</p>
              </div>
              <Switch
                isSelected={settings.floatBallEnabled}
                onValueChange={(value) =>
                  setSettings({ ...settings, floatBallEnabled: value })
                }
                size="sm"
              />
            </div>
          </CardBody>
        </Card>

        {/* 保存按钮 */}
        <Button
          color="primary"
          startContent={<Save size={16} />}
          onPress={handleSave}
          className="w-full"
        >
          保存设置
        </Button>

        <Divider />

        {/* 数据管理 */}
        <Card>
          <CardBody className="gap-4">
            <h3 className="text-sm font-semibold text-default-700">数据管理</h3>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">包含敏感信息</p>
                <p className="text-xs text-default-400">
                  导出时包含 API Key 和保险库数据
                </p>
              </div>
              <Switch
                isSelected={includeSecrets}
                onValueChange={setIncludeSecrets}
                size="sm"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="flat"
                startContent={<Download size={16} />}
                onPress={handleExport}
                className="flex-1"
                size="sm"
              >
                导出数据
              </Button>

              <Button
                variant="flat"
                startContent={<Upload size={16} />}
                onPress={() => document.getElementById('import-file')?.click()}
                className="flex-1"
                size="sm"
              >
                导入数据
              </Button>
              <input
                type="file"
                id="import-file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleImport(file)
                    e.target.value = ''
                  }
                }}
              />
            </div>
          </CardBody>
        </Card>

          {/* 版本信息 */}
          <div className="text-center text-xs text-default-400 py-4">
            <p>AG.NEXUS v1.5.0</p>
            <p className="mt-1">Powered by HeroUI + LangChain</p>
          </div>
        </div>
      </div>
    </div>
  )
}

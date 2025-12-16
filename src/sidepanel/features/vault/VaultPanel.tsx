/**
 * AG.NEXUS - 保险库面板
 * 管理账户密码和 API 密钥，使用 PIN 码保护
 */

import { useState, useEffect, useCallback } from 'react'
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
  RadioGroup,
  Radio,
  Chip,
  Avatar,
} from '@heroui/react'
import { Plus, Copy, Pencil, Trash2, Key, Lock, Unlock, ShieldCheck } from 'lucide-react'
import { Storage } from '../../services/storage'
import type { VaultItem } from '../../services/types'
import toast from 'react-hot-toast'

// 简单的哈希函数
const hashPin = (pin: string): string => {
  let hash = 0
  for (let i = 0; i < pin.length; i++) {
    hash = ((hash << 5) - hash) + pin.charCodeAt(i)
    hash = hash & hash
  }
  return hash.toString()
}

// 简单的加密 (XOR)
const encrypt = (text: string, key: string): string => {
  const keyStr = key.toString()
  let result = ''
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ keyStr.charCodeAt(i % keyStr.length))
  }
  return btoa(result)
}

// 简单的解密
const decrypt = (encrypted: string, key: string): string => {
  const keyStr = key.toString()
  const text = atob(encrypted)
  let result = ''
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ keyStr.charCodeAt(i % keyStr.length))
  }
  return result
}

export function VaultPanel() {
  const [isLoading, setIsLoading] = useState(true)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [masterPinHash, setMasterPinHash] = useState<string | null>(null)
  const [items, setItems] = useState<VaultItem[]>([])

  // PIN 设置/验证弹窗
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false)
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false)
  const [setupPin, setSetupPin] = useState('')
  const [setupPinConfirm, setSetupPinConfirm] = useState('')
  const [verifyPin, setVerifyPin] = useState('')

  // 添加/编辑弹窗
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formType, setFormType] = useState<'password' | 'apikey'>('password')
  const [formName, setFormName] = useState('')
  const [formAccount, setFormAccount] = useState('')
  const [formValue, setFormValue] = useState('')
  const [formNote, setFormNote] = useState('')

  useEffect(() => {
    checkMasterPin()
  }, [])

  const checkMasterPin = async () => {
    try {
      const pin = await Storage.getVaultPin()
      setMasterPinHash(pin)
    } catch (error) {
      console.error('检查主密码失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadItems = useCallback(async () => {
    try {
      const data = await Storage.getVaultItems()
      setItems(data)
    } catch (error) {
      console.error('加载保险库失败:', error)
    }
  }, [])

  // 设置主密码
  const handleSetupPin = async () => {
    if (!setupPin || setupPin.length !== 4 || !/^\d{4}$/.test(setupPin)) {
      toast.error('请输入4位数字密码')
      return
    }
    if (setupPin !== setupPinConfirm) {
      toast.error('两次输入的密码不一致')
      return
    }

    const hash = hashPin(setupPin)
    await Storage.setVaultPin(hash)
    setMasterPinHash(hash)
    setIsUnlocked(true)
    setIsSetupModalOpen(false)
    setSetupPin('')
    setSetupPinConfirm('')
    loadItems()
    toast.success('主密码设置成功')
  }

  // 验证主密码
  const handleVerifyPin = async () => {
    if (!verifyPin || verifyPin.length !== 4) {
      toast.error('请输入4位数字密码')
      return
    }

    const hash = hashPin(verifyPin)
    if (hash !== masterPinHash) {
      toast.error('密码错误')
      setVerifyPin('')
      return
    }

    setIsUnlocked(true)
    setIsVerifyModalOpen(false)
    setVerifyPin('')
    loadItems()
  }

  // 打开保险库
  const handleUnlock = () => {
    if (!masterPinHash) {
      setIsSetupModalOpen(true)
    } else {
      setIsVerifyModalOpen(true)
    }
  }

  // 锁定保险库
  const handleLock = () => {
    setIsUnlocked(false)
    setItems([])
  }

  // 打开添加表单
  const openAddForm = () => {
    setEditingId(null)
    setFormType('password')
    setFormName('')
    setFormAccount('')
    setFormValue('')
    setFormNote('')
    setIsFormModalOpen(true)
  }

  // 打开编辑表单
  const openEditForm = (item: VaultItem) => {
    setEditingId(item.id)
    setFormType(item.type as 'password' | 'apikey')
    setFormName(item.name)
    setFormNote(item.note || '')

    // 解密内容
    if (masterPinHash) {
      try {
        const decrypted = decrypt(item.value, masterPinHash)
        if (item.type === 'password' && decrypted.includes('|||')) {
          const parts = decrypted.split('|||')
          setFormAccount(parts[0])
          setFormValue(parts[1])
        } else {
          setFormAccount('')
          setFormValue(decrypted)
        }
      } catch {
        setFormAccount('')
        setFormValue('')
      }
    }

    setIsFormModalOpen(true)
  }

  // 保存
  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error('请输入名称')
      return
    }
    if (formType === 'password' && !formAccount.trim()) {
      toast.error('请输入账户')
      return
    }
    if (!formValue.trim()) {
      toast.error(formType === 'password' ? '请输入密码' : '请输入 API Key')
      return
    }
    if (!masterPinHash) return

    // 组合并加密
    let fullValue = formValue.trim()
    if (formType === 'password' && formAccount.trim()) {
      fullValue = `${formAccount.trim()}|||${formValue.trim()}`
    }
    const encrypted = encrypt(fullValue, masterPinHash)

    const data = {
      name: formName.trim(),
      value: encrypted,
      type: formType,
      note: formNote.trim(),
    }

    try {
      if (editingId) {
        await Storage.updateVaultItem(editingId, data)
        setItems(items.map((i) => (i.id === editingId ? { ...i, ...data } : i)))
        toast.success('账户已更新')
      } else {
        const newItem = await Storage.addVaultItem(data)
        setItems([newItem, ...items])
        toast.success('账户已添加')
      }
      setIsFormModalOpen(false)
    } catch (error) {
      toast.error('保存失败')
    }
  }

  // 复制
  const handleCopy = async (item: VaultItem) => {
    if (!masterPinHash) return

    try {
      const decrypted = decrypt(item.value, masterPinHash)
      let copyText = decrypted

      if (item.type === 'password' && decrypted.includes('|||')) {
        const parts = decrypted.split('|||')
        copyText = `账户: ${parts[0]}\n密码: ${parts[1]}`
      }

      await navigator.clipboard.writeText(copyText)
      toast.success('已复制到剪贴板')
    } catch {
      toast.error('复制失败')
    }
  }

  // 删除
  const handleDelete = async (id: string) => {
    try {
      await Storage.removeVaultItem(id)
      setItems(items.filter((i) => i.id !== id))
      toast.success('账户已删除')
    } catch {
      toast.error('删除失败')
    }
  }

  // 获取账户显示信息
  const getAccountInfo = (item: VaultItem): string | null => {
    if (item.type !== 'password' || !masterPinHash) return null
    try {
      const decrypted = decrypt(item.value, masterPinHash)
      if (decrypted.includes('|||')) {
        return decrypted.split('|||')[0]
      }
    } catch {
      // 解密失败
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" color="primary" />
      </div>
    )
  }

  // 未解锁状态
  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <div className="text-center text-default-400">
          <Lock size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">保险库已锁定</p>
          <p className="text-sm mb-6">
            {masterPinHash ? '请输入 PIN 码解锁' : '首次使用请设置 PIN 码'}
          </p>
          <Button color="primary" onPress={handleUnlock} startContent={<Unlock size={16} />}>
            {masterPinHash ? '解锁保险库' : '设置 PIN 码'}
          </Button>
        </div>

        {/* 功能说明 */}
        <div className="mt-8 text-sm text-default-400 text-center space-y-1">
          <p className="font-medium text-default-500">功能说明:</p>
          <p>加密存储敏感信息，PIN 码保护</p>
          <p>支持密码和 API 密钥两种类型</p>
          <p>一键复制功能，安全便捷</p>
        </div>

        {/* 设置 PIN 弹窗 */}
        <Modal isOpen={isSetupModalOpen} onClose={() => setIsSetupModalOpen(false)} placement="center">
          <ModalContent>
            <ModalHeader>设置主密码</ModalHeader>
            <ModalBody className="gap-4">
              <Input
                type="password"
                label="PIN 码"
                placeholder="输入 4 位数字密码"
                value={setupPin}
                onValueChange={setSetupPin}
                maxLength={4}
              />
              <Input
                type="password"
                label="确认 PIN 码"
                placeholder="再次输入 PIN 码"
                value={setupPinConfirm}
                onValueChange={setSetupPinConfirm}
                maxLength={4}
                onKeyDown={(e) => e.key === 'Enter' && handleSetupPin()}
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={() => setIsSetupModalOpen(false)}>
                取消
              </Button>
              <Button color="primary" onPress={handleSetupPin}>
                确定
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* 验证 PIN 弹窗 */}
        <Modal isOpen={isVerifyModalOpen} onClose={() => setIsVerifyModalOpen(false)} placement="center">
          <ModalContent>
            <ModalHeader>验证主密码</ModalHeader>
            <ModalBody>
              <Input
                type="password"
                label="PIN 码"
                placeholder="输入 4 位数字密码"
                value={verifyPin}
                onValueChange={setVerifyPin}
                maxLength={4}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyPin()}
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={() => setIsVerifyModalOpen(false)}>
                取消
              </Button>
              <Button color="primary" onPress={handleVerifyPin}>
                解锁
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    )
  }

  // 已解锁状态
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
            icon={<ShieldCheck size={16} />}
          />
          <span className="text-sm font-medium">保险库</span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="light" color="warning" onPress={handleLock} startContent={<Lock size={14} />}>
            锁定
          </Button>
          <Button size="sm" color="primary" isIconOnly onPress={openAddForm} title="添加账户">
            <Plus size={16} />
          </Button>
        </div>
      </div>

      {/* 账户列表 */}
      <div className="flex-1 overflow-y-auto p-3">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-default-400">
              <Key size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">暂无账户密钥</p>
              <p className="text-sm">点击右上角 + 添加账户或 API 密钥</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const accountInfo = getAccountInfo(item)
              return (
                <Card key={item.id} className="hover:bg-default-50">
                  <CardBody className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-default-100">
                        {item.type === 'apikey' ? (
                          <Key size={16} className="text-default-500" />
                        ) : (
                          <Lock size={16} className="text-default-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{item.name}</p>
                          <Chip size="sm" variant="flat">
                            {item.type === 'apikey' ? 'API Key' : '密码'}
                          </Chip>
                        </div>
                        {accountInfo && (
                          <p className="text-xs text-default-400 mt-1">账户: {accountInfo}</p>
                        )}
                        {item.note && (
                          <p className="text-xs text-default-400 mt-1">{item.note}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="light"
                          isIconOnly
                          onPress={() => handleCopy(item)}
                          title="复制"
                        >
                          <Copy size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="light"
                          isIconOnly
                          onPress={() => openEditForm(item)}
                          title="编辑"
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="light"
                          color="danger"
                          isIconOnly
                          onPress={() => handleDelete(item.id)}
                          title="删除"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* 添加/编辑弹窗 */}
      <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} placement="center" size="lg">
        <ModalContent>
          <ModalHeader>{editingId ? '编辑账户' : '添加账户'}</ModalHeader>
          <ModalBody className="gap-4">
            <RadioGroup
              label="类型"
              orientation="horizontal"
              value={formType}
              onValueChange={(v) => setFormType(v as 'password' | 'apikey')}
              size="sm"
            >
              <Radio value="password">密码</Radio>
              <Radio value="apikey">API Key</Radio>
            </RadioGroup>

            <Input
              label="名称"
              placeholder="输入名称 (如: GitHub)"
              value={formName}
              onValueChange={setFormName}
            />

            {formType === 'password' && (
              <Input
                label="账户"
                placeholder="输入账户/邮箱"
                value={formAccount}
                onValueChange={setFormAccount}
              />
            )}

            <Input
              type="password"
              label={formType === 'password' ? '密码' : 'API Key'}
              placeholder={formType === 'password' ? '输入密码' : '输入 API Key'}
              value={formValue}
              onValueChange={setFormValue}
            />

            <Textarea
              label="备注"
              placeholder="输入备注 (可选)"
              value={formNote}
              onValueChange={setFormNote}
              minRows={2}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsFormModalOpen(false)}>
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

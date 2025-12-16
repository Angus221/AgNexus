/**
 * AG.NEXUS - 主题 Context
 * 管理亮色/暗色主题切换
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

/**
 * 主题类型
 */
export type ThemeType = 'light' | 'dark' | 'auto'

/**
 * Theme Context 值类型
 */
interface ThemeContextValue {
  theme: ThemeType
  setTheme: (theme: ThemeType) => void
  isDark: boolean
}

/**
 * 创建 Context
 */
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

/**
 * ThemeProvider 组件
 */
interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeType>('auto')
  const [isDark, setIsDark] = useState(false)

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const updateTheme = () => {
      if (theme === 'auto') {
        const systemIsDark = mediaQuery.matches
        setIsDark(systemIsDark)
        document.documentElement.classList.toggle('dark', systemIsDark)
      } else {
        const shouldBeDark = theme === 'dark'
        setIsDark(shouldBeDark)
        document.documentElement.classList.toggle('dark', shouldBeDark)
      }
    }

    // 初始化主题
    updateTheme()

    // 监听系统主题变化
    mediaQuery.addEventListener('change', updateTheme)

    return () => {
      mediaQuery.removeEventListener('change', updateTheme)
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * useTheme Hook
 */
export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

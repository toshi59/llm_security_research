'use client'

import * as React from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from './theme-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = React.useState(false)

  const themes = [
    {
      value: 'light',
      label: 'ライト',
      icon: Sun,
      description: '明るいテーマ'
    },
    {
      value: 'dark', 
      label: 'ダーク',
      icon: Moon,
      description: '暗いテーマ'
    },
    {
      value: 'system',
      label: 'システム',
      icon: Monitor,
      description: 'システム設定に従う'
    }
  ]

  const currentTheme = themes.find(t => t.value === theme)
  const CurrentIcon = currentTheme?.icon || Monitor

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-start gap-2 text-left font-normal"
      >
        <CurrentIcon className="h-4 w-4" />
        <span className="hidden sm:inline">{currentTheme?.label}</span>
      </Button>

      {isOpen && (
        <>
          {/* オーバーレイ */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* テーマ選択パネル */}
          <Card className="absolute top-full right-0 z-50 mt-2 w-48 shadow-lg">
            <CardContent className="p-2">
              <div className="space-y-1">
                {themes.map((themeOption) => {
                  const Icon = themeOption.icon
                  const isActive = theme === themeOption.value
                  
                  return (
                    <Button
                      key={themeOption.value}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        'w-full justify-start gap-2 text-left font-normal',
                        isActive && 'bg-accent text-accent-foreground'
                      )}
                      onClick={() => {
                        setTheme(themeOption.value as 'light' | 'dark' | 'system')
                        setIsOpen(false)
                      }}
                    >
                      <Icon className="h-4 w-4" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {themeOption.label}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {themeOption.description}
                        </div>
                      </div>
                    </Button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

// シンプルなトグルボタン版（アイコンのみ）
export function ThemeToggleSimple({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()

  const handleToggle = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />
      case 'dark':
        return <Moon className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleToggle}
      className={className}
      title={`現在: ${theme === 'light' ? 'ライト' : theme === 'dark' ? 'ダーク' : 'システム'}テーマ`}
    >
      {getIcon()}
    </Button>
  )
}
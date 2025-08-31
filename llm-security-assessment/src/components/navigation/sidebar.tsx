'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Shield, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  children?: NavItem[]
}

const navItems: NavItem[] = [
  {
    label: '🏠 ホーム',
    href: '/'
  },
  {
    label: '📊 アセスメント結果',
    href: '/assessments',
    children: [
      {
        label: 'ダッシュボード',
        href: '/assessments/dashboard'
      },
      {
        label: '詳細結果',
        href: '/assessments/details'
      }
    ]
  },
  {
    label: '⚙️ 生成AIモデルアセスメント',
    href: '/admin'
  }
]

export function Sidebar() {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = React.useState<string[]>(['📊 アセスメント結果'])

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    )
  }

  const isActiveOrParent = (item: NavItem): boolean => {
    if (pathname === item.href) return true
    if (item.children) {
      return item.children.some(child => pathname === child.href)
    }
    return false
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-white border-r border-gray-200 z-40">
      {/* ヘッダー部分 */}
      <div className="flex items-center gap-2 px-4 py-4">
        <Shield className="h-5 w-5 text-blue-600" />
        <span className="font-semibold text-gray-900">
          LLM評価システム
        </span>
      </div>
      
      {/* ナビゲーション */}
      <nav className="py-4">
        <div className="space-y-1 px-3">
          {navItems.map((item) => {
            const isExpanded = expandedItems.includes(item.label)
            const isActive = isActiveOrParent(item)
            
            return (
              <div key={item.href}>
                {item.children ? (
                  <>
                    <button
                      onClick={() => toggleExpanded(item.label)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 text-base rounded-md transition-colors',
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      <span>{item.label}</span>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.children.map((child) => {
                          const isChildActive = pathname === child.href
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={cn(
                                'block px-3 py-2 text-sm rounded-md transition-colors',
                                isChildActive
                                  ? 'bg-blue-50 text-blue-700 font-medium'
                                  : 'text-gray-600 hover:bg-gray-100'
                              )}
                            >
                              {child.label}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      'block px-3 py-2 text-base rounded-md transition-colors',
                      pathname === item.href
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      </nav>
    </aside>
  )
}
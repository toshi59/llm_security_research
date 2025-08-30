'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
}

const navItems: NavItem[] = [
  {
    label: '🏠 ダッシュボード',
    href: '/'
  },
  {
    label: '📊 評価結果',
    href: '/assessments'
  },
  {
    label: '⚙️ 管理画面',
    href: '/admin'
  }
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-gray-50 dark:bg-gray-950 z-40">
      {/* ヘッダー部分 */}
      <div className="flex items-center gap-2 px-4 py-4">
        <Shield className="h-5 w-5 text-blue-600" />
        <span className="font-semibold text-gray-900 dark:text-gray-100">
          LLM評価システム
        </span>
      </div>
      
      {/* ナビゲーション */}
      <nav className="py-4">
        <div className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'block px-3 py-2 text-base rounded-md transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium dark:bg-blue-900/30 dark:text-blue-300'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </aside>
  )
}
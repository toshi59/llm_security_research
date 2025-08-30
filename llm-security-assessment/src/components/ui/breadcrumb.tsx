'use client'

import * as React from 'react'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ReactNode
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav 
      className={cn('flex items-center space-x-1 text-sm', className)}
      aria-label="パンくずリスト"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        
        return (
          <React.Fragment key={index}>
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
            )}
            
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ) : (
              <span 
                className={cn(
                  'flex items-center gap-1',
                  isLast 
                    ? 'text-gray-900 font-medium' 
                    : 'text-gray-500'
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </span>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}

// プリセット用のパンくずリスト
export function HomeBreadcrumb() {
  return (
    <Breadcrumb
      items={[
        {
          label: 'ホーム',
          href: '/',
          icon: <Home className="h-3 w-3" />
        }
      ]}
    />
  )
}

export function AssessmentsBreadcrumb() {
  return (
    <Breadcrumb
      items={[
        {
          label: 'ホーム',
          href: '/',
          icon: <Home className="h-3 w-3" />
        },
        {
          label: '評価結果一覧'
        }
      ]}
    />
  )
}

export function AdminBreadcrumb() {
  return (
    <Breadcrumb
      items={[
        {
          label: 'ホーム',
          href: '/',
          icon: <Home className="h-3 w-3" />
        },
        {
          label: '管理画面'
        }
      ]}
    />
  )
}

export function LoginBreadcrumb() {
  return (
    <Breadcrumb
      items={[
        {
          label: 'ホーム',
          href: '/',
          icon: <Home className="h-3 w-3" />
        },
        {
          label: 'ログイン'
        }
      ]}
    />
  )
}
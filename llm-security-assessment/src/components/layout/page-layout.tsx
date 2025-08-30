'use client'

import * as React from 'react'
import { Sidebar } from '@/components/navigation/sidebar'
import { Breadcrumb, BreadcrumbItem } from '@/components/ui/breadcrumb'
import { cn } from '@/lib/utils'

interface PageLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  className?: string
  showBreadcrumbs?: boolean
}

export function PageLayout({
  children,
  title,
  description,
  breadcrumbs = [],
  className,
  showBreadcrumbs = true
}: PageLayoutProps) {
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950">
      {/* 常時表示サイドバー */}
      <Sidebar />
      
      {/* メインコンテンツエリア（サイドバー分の余白を確保） */}
      <div className="flex-1 ml-56">
        <main className={cn('min-h-screen', className)}>
          {/* パンくずリストとヘッダー */}
          {(showBreadcrumbs && breadcrumbs.length > 0) || title && (
            <div className="bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
              <div className="px-4 sm:px-6 lg:px-8 py-4">
                {showBreadcrumbs && breadcrumbs.length > 0 && (
                  <div className="mb-3">
                    <Breadcrumb items={breadcrumbs} />
                  </div>
                )}
                
                {title && (
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {title}
                    </h1>
                    {description && (
                      <p className="mt-1 text-gray-600 dark:text-gray-400">
                        {description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* メインコンテンツ（幅を画面に合わせてレスポンシブに） */}
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
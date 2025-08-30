'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { X, ExternalLink, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SlideOverProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title: string
  className?: string
}

export function SlideOver({
  isOpen,
  onClose,
  children,
  title,
  className
}: SlideOverProps) {
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* スライドオーバー */}
      <div
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white shadow-2xl',
          'transform transition-transform duration-300 ease-in-out',
          'border-l border-gray-200',
          isOpen ? 'translate-x-0' : 'translate-x-full',
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="slide-over-title"
      >
        <div className="flex flex-col h-full">
          {/* ヘッダー */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2
              id="slide-over-title"
              className="text-xl font-semibold text-gray-900"
            >
              {title}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              aria-label="閉じる"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* コンテンツ */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </>
  )
}

// セキュリティアイテム詳細用の特別なスライドオーバー
interface SecurityItemDetailProps {
  isOpen: boolean
  onClose: () => void
  item: {
    id: string
    category: string
    subcategory: string
    criteria: string
    standards: string
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
    judgement?: '○' | '×' | '要改善' | null
    comment?: string
    evidences?: string[]
    filledBy?: string
    updatedAt?: string
  } | null
}

export function SecurityItemDetail({
  isOpen,
  onClose,
  item
}: SecurityItemDetailProps) {
  if (!item) return null

  // 証跡内のURLをリンク化する関数
  const renderEvidenceWithLinks = (text: string) => {
    // URL のパターンをマッチ
    const urlPattern = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/gi;
    const parts = text.split(urlPattern);
    
    return parts.map((part, index) => {
      if (urlPattern.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline break-all inline-flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const getRiskLevelBadge = (level: string) => {
    const variants = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    } as const
    
    const labels = {
      low: '低',
      medium: '中',
      high: '高',
      critical: '極高'
    } as const

    type RiskLevel = keyof typeof variants
    const riskLevel = level as RiskLevel

    return (
      <span className={cn('px-2 py-1 text-xs font-medium rounded-full', variants[riskLevel] || 'bg-gray-100 text-gray-800')}>
        {labels[riskLevel] || level}
      </span>
    )
  }

  const getJudgementIcon = (judgement: string | null) => {
    switch (judgement) {
      case '○':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case '×':
        return <XCircle className="h-5 w-5 text-red-500" />
      case '要改善':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      default:
        return <div className="h-5 w-5 rounded-full bg-gray-300" />
    }
  }

  return (
    <SlideOver
      isOpen={isOpen}
      onClose={onClose}
      title={`${item.category} - ${item.subcategory}`}
      className="max-w-3xl"
    >
      <div className="p-6 space-y-6">
        {/* 基本情報 */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline" className="text-xs">
                {item.category}
              </Badge>
              {getRiskLevelBadge(item.riskLevel)}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ID: {item.id}
            </p>
          </div>
          
          {/* 判定状況 */}
          <Card className="min-w-[120px]">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                {getJudgementIcon(item.judgement || null)}
                <span className="text-sm font-medium">
                  {item.judgement === '○' && '適合'}
                  {item.judgement === '×' && '不適合'}
                  {item.judgement === '要改善' && '要改善'}
                  {!item.judgement && '未評価'}
                </span>
              </div>
              {item.filledBy && (
                <p className="text-xs text-gray-500 mt-1">
                  評価者: {item.filledBy}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 評価基準 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">評価基準</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {item.criteria}
            </p>
          </CardContent>
        </Card>

        {/* 標準・ガイドライン */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">関連標準・ガイドライン</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {item.standards}
            </p>
          </CardContent>
        </Card>

        {/* コメント */}
        {item.comment && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">評価コメント</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {item.comment}
              </p>
            </CardContent>
          </Card>
        )}

        {/* 証跡・根拠 */}
        {item.evidences && item.evidences.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                証跡・根拠
                <Badge variant="secondary" className="text-xs">
                  {item.evidences.length}件
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {item.evidences.map((evidence, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          {renderEvidenceWithLinks(evidence)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* メタ情報 */}
        {(item.updatedAt || item.filledBy) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">更新情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {item.filledBy && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">評価者:</span>
                  <span className="text-gray-700 dark:text-gray-300">{item.filledBy}</span>
                </div>
              )}
              {item.updatedAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">更新日時:</span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {new Date(item.updatedAt).toLocaleString('ja-JP')}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </SlideOver>
  )
}
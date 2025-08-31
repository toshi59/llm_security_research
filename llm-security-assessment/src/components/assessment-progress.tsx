'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, AlertCircle, Loader2, Brain } from 'lucide-react'
import type { AssessmentStep, AssessmentProgressData } from '@/lib/types'

interface AssessmentProgressProps {
  data: AssessmentProgressData
  onCancel?: () => void
}

export function AssessmentProgress({ data, onCancel }: AssessmentProgressProps) {
  const [elapsedTime, setElapsedTime] = useState(0)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])

  const progressPercentage = data.totalItems > 0 ? (data.completedItems / data.totalItems) * 100 : 0

  const getStepIcon = (status: AssessmentStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStepDescription = (step: AssessmentStep) => {
    switch (step.id) {
      case 'search':
        return '関連情報の検索と収集'
      case 'generate':
        return 'AIモデルによる応答生成'
      case 'evaluate':
        return 'セキュリティ項目の評価'
      default:
        return step.name
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      {/* 全体進捗 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              アセスメント実行中: {data.modelName}
            </div>
            <Badge 
              variant={data.overallStatus === 'error' ? 'destructive' : 'default'}
              className={data.overallStatus === 'running' ? 'bg-blue-100 text-blue-800' : ''}
            >
              {data.overallStatus === 'preparing' && '準備中'}
              {data.overallStatus === 'running' && '実行中'}
              {data.overallStatus === 'completed' && '完了'}
              {data.overallStatus === 'error' && 'エラー'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* プログレスバー */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>進捗: {data.completedItems}/{data.totalItems} 項目</span>
              <span>{progressPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* 時間情報 */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>経過時間: {formatTime(elapsedTime)}</span>
            {data.estimatedTimeRemaining && (
              <span>残り時間: 約{Math.ceil(data.estimatedTimeRemaining / 60)}分</span>
            )}
          </div>

          {/* キャンセルボタン */}
          {onCancel && data.overallStatus === 'running' && (
            <button
              onClick={onCancel}
              className="w-full px-4 py-2 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50"
            >
              アセスメントをキャンセル
            </button>
          )}
        </CardContent>
      </Card>

      {/* 現在の処理項目 */}
      {data.currentItem && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">現在の処理項目</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="font-medium">{data.currentItem.name}</div>
              <Badge variant="outline">{data.currentItem.category}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ステップ詳細 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">処理ステップ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.steps.map((step, index) => (
              <div key={step.id} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getStepIcon(step.status)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {index + 1}. {getStepDescription(step)}
                    </span>
                    {step.status === 'running' && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        実行中
                      </Badge>
                    )}
                  </div>
                  {step.details && (
                    <div className="text-sm text-gray-600">
                      {step.details}
                    </div>
                  )}
                  {step.timestamp && (
                    <div className="text-xs text-gray-500">
                      {new Date(step.timestamp).toLocaleTimeString('ja-JP')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// プログレス表示用のモーダル
interface AssessmentProgressModalProps extends AssessmentProgressProps {
  isOpen: boolean
  onClose: () => void
}

export function AssessmentProgressModal({ 
  isOpen, 
  onClose, 
  data, 
  onCancel 
}: AssessmentProgressModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">アセスメント実行状況</h2>
            {data.overallStatus === 'completed' && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
              >
                閉じる
              </button>
            )}
          </div>
          <AssessmentProgress data={data} onCancel={onCancel} />
        </div>
      </div>
    </div>
  )
}
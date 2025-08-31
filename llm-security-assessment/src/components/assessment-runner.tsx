'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AssessmentProgressModal } from '@/components/assessment-progress'
import { useAssessmentProgress } from '@/hooks/useAssessmentProgress'
import { Play, StopCircle } from 'lucide-react'

interface AssessmentRunnerProps {
  modelId: string
  modelName: string
  securityItemIds: string[]
  onComplete?: (assessmentId: string) => void
}

export function AssessmentRunner({ 
  modelId, 
  modelName, 
  securityItemIds, 
  onComplete 
}: AssessmentRunnerProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [currentAssessmentId, setCurrentAssessmentId] = useState<string | null>(null)
  const [showProgress, setShowProgress] = useState(false)
  
  const { progressData, isConnected, error, reconnect } = useAssessmentProgress(currentAssessmentId)

  const handleStartAssessment = async () => {
    try {
      setIsRunning(true)
      
      const response = await fetch('/api/assessments/run-with-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId,
          itemIds: securityItemIds
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setCurrentAssessmentId(result.assessmentId)
        setShowProgress(true)
      } else {
        throw new Error(result.error || 'アセスメントの開始に失敗しました')
      }
    } catch (error) {
      console.error('Failed to start assessment:', error)
      setIsRunning(false)
      alert('アセスメントの開始に失敗しました')
    }
  }

  const handleCancelAssessment = async () => {
    if (currentAssessmentId) {
      try {
        await fetch(`/api/assessments/${currentAssessmentId}/cancel`, {
          method: 'POST'
        })
        
        setIsRunning(false)
        setCurrentAssessmentId(null)
        setShowProgress(false)
      } catch (error) {
        console.error('Failed to cancel assessment:', error)
      }
    }
  }

  const handleCloseProgress = () => {
    setShowProgress(false)
    setIsRunning(false)
    
    if (progressData?.overallStatus === 'completed' && currentAssessmentId && onComplete) {
      onComplete(currentAssessmentId)
    }
    
    setCurrentAssessmentId(null)
  }

  // アセスメントが完了した場合の自動処理
  if (progressData?.overallStatus === 'completed' && isRunning) {
    setIsRunning(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button
          onClick={handleStartAssessment}
          disabled={isRunning || securityItemIds.length === 0}
          className="flex items-center gap-2"
        >
          <Play className="h-4 w-4" />
          アセスメント実行
        </Button>
        
        {isRunning && (
          <Button
            onClick={handleCancelAssessment}
            variant="outline"
            className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
          >
            <StopCircle className="h-4 w-4" />
            キャンセル
          </Button>
        )}

        {progressData && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>進捗: {progressData.completedItems}/{progressData.totalItems}</span>
            {isConnected ? (
              <span className="text-green-600">● 接続中</span>
            ) : (
              <button 
                onClick={reconnect}
                className="text-blue-600 hover:underline"
              >
                再接続
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="text-sm text-gray-600">
        <p>モデル: {modelName}</p>
        <p>評価項目数: {securityItemIds.length}項目</p>
      </div>

      {/* 進捗表示モーダル */}
      <AssessmentProgressModal
        isOpen={showProgress}
        onClose={handleCloseProgress}
        data={progressData || {
          modelName,
          totalItems: securityItemIds.length,
          completedItems: 0,
          steps: [],
          overallStatus: 'preparing'
        }}
        onCancel={isRunning ? handleCancelAssessment : undefined}
      />
    </div>
  )
}
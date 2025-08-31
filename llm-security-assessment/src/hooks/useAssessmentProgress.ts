'use client'

import { useState, useEffect, useCallback } from 'react'
import type { AssessmentProgressData } from '@/components/assessment-progress'

export function useAssessmentProgress(assessmentId: string | null) {
  const [progressData, setProgressData] = useState<AssessmentProgressData | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connectToProgressStream = useCallback(() => {
    if (!assessmentId) return

    console.log('Connecting to progress stream for assessment:', assessmentId)
    setError(null)

    const eventSource = new EventSource(`/api/assessments/${assessmentId}/progress`)

    eventSource.onopen = () => {
      console.log('Progress stream connected')
      setIsConnected(true)
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as AssessmentProgressData
        setProgressData(data)
        
        // アセスメントが完了またはエラーの場合は接続を閉じる
        if (data.overallStatus === 'completed' || data.overallStatus === 'error') {
          eventSource.close()
          setIsConnected(false)
        }
      } catch (err) {
        console.error('Error parsing progress data:', err)
        setError('進捗データの解析に失敗しました')
      }
    }

    eventSource.onerror = (event) => {
      console.error('Progress stream error:', event)
      setError('進捗データの取得でエラーが発生しました')
      setIsConnected(false)
      eventSource.close()
    }

    return eventSource
  }, [assessmentId])

  useEffect(() => {
    if (!assessmentId) {
      setProgressData(null)
      setIsConnected(false)
      return
    }

    const eventSource = connectToProgressStream()

    return () => {
      if (eventSource) {
        eventSource.close()
        setIsConnected(false)
      }
    }
  }, [assessmentId, connectToProgressStream])

  const reconnect = useCallback(() => {
    if (assessmentId) {
      const eventSource = connectToProgressStream()
      return () => eventSource?.close()
    }
  }, [assessmentId, connectToProgressStream])

  return {
    progressData,
    isConnected,
    error,
    reconnect
  }
}
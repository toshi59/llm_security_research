import { NextRequest } from 'next/server'
import { RedisService } from '@/lib/redis'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  // Server-Sent Events用のヘッダー設定
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  })

  const stream = new ReadableStream({
    start(controller) {
      // 進捗データの送信
      const sendProgress = async () => {
        try {
          // Redisから進捗データを取得
          const progressData = await RedisService.getAssessmentProgress(id)
          
          if (progressData) {
            const data = `data: ${JSON.stringify(progressData)}\n\n`
            controller.enqueue(new TextEncoder().encode(data))
          }

          // アセスメントが完了している場合は接続を閉じる
          if (progressData?.overallStatus === 'completed' || progressData?.overallStatus === 'error') {
            controller.close()
            return
          }

          // 1秒後に再度チェック
          setTimeout(sendProgress, 1000)
        } catch (error) {
          console.error('Progress stream error:', error)
          controller.error(error)
        }
      }

      sendProgress()
    },
    cancel() {
      // クリーンアップ処理
      console.log('Progress stream cancelled')
    }
  })

  return new Response(stream, { headers })
}
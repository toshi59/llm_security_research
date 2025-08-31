import { NextRequest, NextResponse } from 'next/server'
import { RedisService } from '@/lib/redis'
import type { AssessmentProgressData, Model, SecurityItem } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const { modelId, itemIds } = await request.json()
    
    console.log('Starting assessment with progress tracking:', { modelId, itemIds })

    // モデルとセキュリティ項目を取得
    const model = await RedisService.getModel(modelId)
    if (!model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 })
    }

    const securityItems = await Promise.all(
      itemIds.map((id: string) => RedisService.getSecurityItem(id))
    )
    const validItems = securityItems.filter(item => item !== null)

    if (validItems.length === 0) {
      return NextResponse.json({ error: 'No valid security items found' }, { status: 400 })
    }

    // アセスメントを作成
    const assessment = await RedisService.createAssessment({
      modelId: model.id,
      modelName: model.name,
      status: 'in_progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    // 初期進捗データを設定
    const initialProgress: AssessmentProgressData = {
      modelName: model.name,
      totalItems: validItems.length,
      completedItems: 0,
      steps: [
        { id: 'search', name: '情報検索', status: 'pending' },
        { id: 'generate', name: 'AI応答生成', status: 'pending' },
        { id: 'evaluate', name: '評価実行', status: 'pending' }
      ],
      overallStatus: 'preparing'
    }

    await RedisService.setAssessmentProgress(assessment.id, initialProgress)

    // バックグラウンドでアセスメントを実行
    processAssessmentWithProgress(assessment.id, model, validItems)

    return NextResponse.json({
      success: true,
      assessmentId: assessment.id,
      message: 'アセスメントを開始しました',
    })

  } catch (error) {
    console.error('Assessment start error:', error)
    return NextResponse.json(
      { error: 'Failed to start assessment' },
      { status: 500 }
    )
  }
}

// バックグラウンドでアセスメントを処理する関数
async function processAssessmentWithProgress(
  assessmentId: string,
  model: Model,
  securityItems: SecurityItem[]
) {
  try {
    // 全体ステータスを実行中に更新
    let currentProgress = await RedisService.getAssessmentProgress(assessmentId)
    if (currentProgress) {
      currentProgress.overallStatus = 'running'
      await RedisService.setAssessmentProgress(assessmentId, currentProgress)
    }

    let completedItems = 0

    for (let i = 0; i < securityItems.length; i++) {
      const item = securityItems[i]
      
      // 現在の処理項目を更新
      currentProgress.currentItem = {
        id: item.id,
        name: item.name,
        category: item.category
      }
      await RedisService.setAssessmentProgress(assessmentId, currentProgress)

      // ステップ1: 情報検索
      await RedisService.updateAssessmentStep(
        assessmentId, 
        'search', 
        'running', 
        `${item.name}に関連する情報を検索中...`
      )
      
      // 模擬的な検索処理（実際にはWeb検索やDB検索を実装）
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      await RedisService.updateAssessmentStep(
        assessmentId, 
        'search', 
        'completed', 
        '関連情報の検索が完了しました'
      )

      // ステップ2: AI応答生成
      await RedisService.updateAssessmentStep(
        assessmentId, 
        'generate', 
        'running', 
        'AIモデルによる応答を生成中...'
      )
      
      // 模擬的なAI応答生成（実際にはOpenAI/Claude APIを呼び出し）
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      await RedisService.updateAssessmentStep(
        assessmentId, 
        'generate', 
        'completed', 
        'AI応答の生成が完了しました'
      )

      // ステップ3: 評価実行
      await RedisService.updateAssessmentStep(
        assessmentId, 
        'evaluate', 
        'running', 
        'セキュリティ評価を実行中...'
      )

      // 模擬的な評価処理
      const judgement = Math.random() > 0.7 ? '○' : Math.random() > 0.5 ? '×' : '要改善'
      const response = `模擬応答: ${item.name}についての評価結果です。`
      const reason = `評価理由: ${judgement}の判定となりました。`

      // AssessmentItemを作成
      await RedisService.createAssessmentItem({
        assessmentId: assessmentId,
        itemId: item.id,
        judgement,
        response,
        reason,
        filledBy: 'システム自動評価',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      await RedisService.updateAssessmentStep(
        assessmentId, 
        'evaluate', 
        'completed', 
        '評価が完了しました'
      )

      // 完了項目数を更新
      completedItems++
      currentProgress = await RedisService.getAssessmentProgress(assessmentId)
      if (currentProgress) {
        currentProgress.completedItems = completedItems
        currentProgress.currentItem = undefined
      }
      
      // 全ステップを次の項目用にリセット
      if (i < securityItems.length - 1 && currentProgress) {
        currentProgress.steps = currentProgress.steps.map(step => ({
          ...step,
          status: 'pending' as const,
          details: undefined,
          timestamp: undefined
        }))
      }
      
      if (currentProgress) {
        await RedisService.setAssessmentProgress(assessmentId, currentProgress)
      }
    }

    // アセスメント完了
    await RedisService.updateAssessment(assessmentId, {
      status: 'completed',
      updatedAt: new Date().toISOString(),
    })

    // 最終進捗状態を更新
    const finalProgress = await RedisService.getAssessmentProgress(assessmentId)
    if (finalProgress) {
      finalProgress.overallStatus = 'completed'
      await RedisService.setAssessmentProgress(assessmentId, finalProgress)
    }

    console.log(`Assessment ${assessmentId} completed successfully`)

  } catch (error) {
    console.error('Assessment processing error:', error)
    
    // エラー状態を記録
    let currentProgress = await RedisService.getAssessmentProgress(assessmentId)
    if (currentProgress) {
      currentProgress.overallStatus = 'error'
      await RedisService.setAssessmentProgress(assessmentId, currentProgress)
    }

    await RedisService.updateAssessment(assessmentId, {
      status: 'failed',
      updatedAt: new Date().toISOString(),
    })
  }
}
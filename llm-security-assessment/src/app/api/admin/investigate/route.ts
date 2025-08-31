import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RedisService } from '@/lib/redis';
import { InvestigationService } from '@/lib/investigation';

const investigateSchema = z.object({
  modelName: z.string().min(1),
  vendor: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    console.log('Investigation API called');
    
    const body = await request.json();
    console.log('Request body:', body);
    
    const { modelName, vendor = '' } = investigateSchema.parse(body);
    console.log('Parsed:', { modelName, vendor });

    console.log('Creating model...');
    const model = await RedisService.createModel({
      name: modelName,
      vendor: vendor,
      notes: '',
    });
    console.log('Model created:', model.id);

    console.log('Creating assessment...');
    const assessment = await RedisService.createAssessment({
      modelId: model.id,
      createdAt: new Date().toISOString(),
      createdBy: 'admin',
      status: 'in_progress',
      summary: `${modelName}のアセスメントを実行中...`,
    });
    console.log('Assessment created:', assessment.id);

    // バックグラウンドで調査を開始（非同期）
    processInvestigationBackground(assessment.id, model, modelName, vendor)
      .catch(error => {
        console.error('Background investigation error:', error);
      });

    // すぐにレスポンスを返す
    return NextResponse.json({
      success: true,
      assessmentId: assessment.id,
      model,
      message: 'アセスメントをバックグラウンドで開始しました',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    console.error('Investigation error:', error);
    return NextResponse.json(
      { error: 'Investigation failed' },
      { status: 500 }
    );
  }
}

// バックグラウンド処理関数
async function processInvestigationBackground(
  assessmentId: string,
  model: { id: string; name: string; vendor: string; notes?: string },
  modelName: string,
  vendor: string
) {
  try {
    console.log(`Starting background investigation for assessment ${assessmentId}`);

    // 進捗状況を初期化
    await RedisService.setAssessmentProgress(assessmentId, {
      modelName: model.name,
      totalItems: 0,
      completedItems: 0,
      steps: [
        { id: 'init', name: '初期化', status: 'in_progress' },
        { id: 'search', name: '情報検索', status: 'pending' },
        { id: 'evaluate', name: 'AI評価', status: 'pending' },
        { id: 'summary', name: 'サマリー生成', status: 'pending' },
        { id: 'complete', name: '完了', status: 'pending' }
      ],
      overallStatus: 'running'
    });

    // セキュリティ項目を取得
    console.log('Getting security items...');
    await RedisService.updateAssessmentStep(assessmentId, 'init', 'completed', 'セキュリティ項目を取得しました');
    
    const securityItems = await RedisService.getAllSecurityItems();
    console.log('Security items count:', securityItems.length);

    // 進捗状況を更新
    await RedisService.updateAssessmentStep(assessmentId, 'search', 'in_progress', '情報検索を開始しています...');
    
    // 実際の調査を実行
    console.log('Starting investigation...');
    const investigationResult = await InvestigationService.investigateModel(
      modelName,
      vendor,
      securityItems
    );
    console.log('Investigation completed, items:', investigationResult.assessmentItems.length);

    await RedisService.updateAssessmentStep(assessmentId, 'search', 'completed', '情報検索が完了しました');
    await RedisService.updateAssessmentStep(assessmentId, 'evaluate', 'completed', 'AI評価が完了しました');
    await RedisService.updateAssessmentStep(assessmentId, 'summary', 'in_progress', 'サマリーを生成中...');

    // アセスメント結果を保存
    const createdItems = await Promise.all(
      investigationResult.assessmentItems.map((item) =>
        RedisService.createAssessmentItem({
          assessmentId: assessmentId,
          itemId: item.itemId!,
          judgement: item.judgement || null,
          comment: item.comment || '',
          evidences: item.evidences || [],
          filledBy: 'AI',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      )
    );

    // アセスメントを完了状態に更新
    await RedisService.updateAssessment(assessmentId, {
      status: 'completed',
      summary: investigationResult.overallAssessment || `${modelName}のアセスメント完了`,
      updatedAt: new Date().toISOString(),
    });

    // 最終進捗状態を更新
    await RedisService.updateAssessmentStep(assessmentId, 'summary', 'completed', 'サマリー生成完了');
    await RedisService.updateAssessmentStep(assessmentId, 'complete', 'completed', 'アセスメント完了');

    // 最終進捗データを更新
    await RedisService.setAssessmentProgress(assessmentId, {
      modelName: model.name,
      totalItems: investigationResult.assessmentItems.length,
      completedItems: investigationResult.assessmentItems.length,
      steps: [
        { id: 'init', name: '初期化', status: 'completed' },
        { id: 'search', name: '情報検索', status: 'completed' },
        { id: 'evaluate', name: 'AI評価', status: 'completed' },
        { id: 'summary', name: 'サマリー生成', status: 'completed' },
        { id: 'complete', name: '完了', status: 'completed' }
      ],
      overallStatus: 'completed',
      result: {
        assessmentId,
        itemCount: createdItems.length,
        categorySummaries: investigationResult.categorySummaries,
        overallAssessment: investigationResult.overallAssessment,
      }
    });

    await RedisService.createAuditLog({
      user: 'admin',
      action: 'CREATE_ASSESSMENT',
      entityType: 'assessment',
      entityId: assessmentId,
      changes: {
        modelName,
        vendor,
        itemCount: createdItems.length,
      },
    });

    console.log(`Background investigation completed for assessment ${assessmentId}`);

  } catch (error) {
    console.error('Background investigation error:', error);
    
    // エラー状態を記録
    await RedisService.updateAssessment(assessmentId, {
      status: 'failed',
      summary: 'アセスメント中にエラーが発生しました',
      updatedAt: new Date().toISOString(),
    });

    await RedisService.setAssessmentProgress(assessmentId, {
      modelName: model.name,
      totalItems: 0,
      completedItems: 0,
      steps: [
        { id: 'error', name: 'エラー', status: 'error' }
      ],
      overallStatus: 'error'
    });
  }
}
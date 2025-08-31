import { NextRequest, NextResponse } from 'next/server';
import { RedisService } from '@/lib/redis';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { modelId: string } }
) {
  try {
    console.log('Delete model API called for modelId:', params.modelId);
    
    // モデルIDの存在確認
    const model = await RedisService.getModel(params.modelId);
    if (!model) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      );
    }

    // このモデルに関連するアセスメントを取得
    const assessments = await RedisService.getAllAssessments();
    const modelAssessments = assessments.filter(assessment => assessment.modelId === params.modelId);

    console.log(`Found ${modelAssessments.length} assessments for model ${model.name}`);

    // 各アセスメントとその関連アイテムを削除
    for (const assessment of modelAssessments) {
      // アセスメントアイテムを削除
      const assessmentItems = await RedisService.getAssessmentItems(assessment.id);
      for (const item of assessmentItems) {
        await RedisService.deleteAssessmentItem(item.id);
      }
      
      // アセスメント自体を削除
      await RedisService.deleteAssessment(assessment.id);
    }

    // モデルを削除
    await RedisService.deleteModel(params.modelId);

    // 監査ログを記録
    await RedisService.createAuditLog({
      user: 'admin',
      action: 'DELETE_MODEL',
      entityType: 'model',
      entityId: params.modelId,
      changes: {
        modelName: model.name,
        vendor: model.vendor,
        deletedAssessments: modelAssessments.length,
      },
    });

    console.log(`Successfully deleted model ${model.name} and ${modelAssessments.length} assessments`);

    return NextResponse.json({
      success: true,
      message: `モデル「${model.name}」とその評価結果（${modelAssessments.length}件）を削除しました`,
      deletedModel: model,
      deletedAssessments: modelAssessments.length,
    });

  } catch (error) {
    console.error('Delete model error:', error);
    return NextResponse.json(
      { error: 'Failed to delete model' },
      { status: 500 }
    );
  }
}
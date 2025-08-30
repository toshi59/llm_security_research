import { NextRequest, NextResponse } from 'next/server';
import { RedisService } from '@/lib/redis';
import { AuthService } from '@/lib/auth';

export async function DELETE(request: NextRequest) {
  try {
    // 管理者認証を確認
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = AuthService.verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // すべてのアセスメントを取得
    const assessments = await RedisService.getAllAssessments();
    
    // モデル別に最新のアセスメントIDを取得
    const latestAssessmentIds = new Set<string>();
    const modelLatestMap = new Map<string, { id: string, createdAt: string }>();
    
    for (const assessment of assessments) {
      const model = await RedisService.getModel(assessment.modelId);
      if (!model) continue;
      
      const modelName = model.name;
      const existing = modelLatestMap.get(modelName);
      
      if (!existing || new Date(assessment.createdAt) > new Date(existing.createdAt)) {
        modelLatestMap.set(modelName, { id: assessment.id, createdAt: assessment.createdAt });
      }
    }
    
    // 最新のアセスメントIDを収集
    for (const latest of modelLatestMap.values()) {
      latestAssessmentIds.add(latest.id);
    }
    
    // 古いアセスメントを削除
    const deletedAssessments: string[] = [];
    for (const assessment of assessments) {
      if (!latestAssessmentIds.has(assessment.id)) {
        // アセスメント項目も削除
        const items = await RedisService.getAssessmentItems(assessment.id);
        for (const item of items) {
          await RedisService.deleteAssessmentItem(item.id);
        }
        
        // アセスメント自体を削除
        await RedisService.deleteAssessment(assessment.id);
        deletedAssessments.push(assessment.id);
      }
    }
    
    return NextResponse.json({
      message: `${deletedAssessments.length}件の古いアセスメントを削除しました`,
      deletedAssessments,
      remainingModels: latestAssessmentIds.size
    });
    
  } catch (error) {
    console.error('Error cleaning up assessments:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup assessments' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { RedisService } from '@/lib/redis';

export async function GET() {
  try {
    console.log('Get models API called');
    
    // 全てのモデルを取得
    const models = await RedisService.getAllModels();
    
    // 各モデルのアセスメント数を取得
    const assessments = await RedisService.getAllAssessments();
    const modelsWithCounts = models.map(model => {
      const modelAssessments = assessments.filter(assessment => assessment.modelId === model.id);
      return {
        ...model,
        assessmentCount: modelAssessments.length,
        lastAssessmentDate: modelAssessments.length > 0 
          ? modelAssessments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
          : null
      };
    });

    // 最新のアセスメント日時でソート
    modelsWithCounts.sort((a, b) => {
      if (!a.lastAssessmentDate && !b.lastAssessmentDate) return 0;
      if (!a.lastAssessmentDate) return 1;
      if (!b.lastAssessmentDate) return -1;
      return new Date(b.lastAssessmentDate).getTime() - new Date(a.lastAssessmentDate).getTime();
    });

    console.log(`Retrieved ${modelsWithCounts.length} models`);

    return NextResponse.json(modelsWithCounts);

  } catch (error) {
    console.error('Get models error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    );
  }
}
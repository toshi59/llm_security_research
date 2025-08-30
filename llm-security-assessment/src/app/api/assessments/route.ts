import { NextRequest, NextResponse } from 'next/server';
import { RedisService } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const modelId = searchParams.get('modelId');
    
    const assessments = await RedisService.getAllAssessments();
    
    let filteredAssessments = assessments;
    if (modelId) {
      filteredAssessments = assessments.filter(a => a.modelId === modelId);
    }
    
    const assessmentWithItems = await Promise.all(
      filteredAssessments.map(async (assessment) => {
        const items = await RedisService.getAssessmentItems(assessment.id);
        const model = await RedisService.getModel(assessment.modelId);
        return {
          ...assessment,
          model,
          items,
        };
      })
    );
    
    // 同じモデルに対して最新のアセスメントのみを保持
    type AssessmentWithItems = typeof assessmentWithItems[0];
    const latestAssessments = assessmentWithItems.reduce((acc: AssessmentWithItems[], current: AssessmentWithItems) => {
      const existingIndex = acc.findIndex(a => a.model?.name === current.model?.name);
      
      if (existingIndex === -1) {
        // 新しいモデルの場合は追加
        acc.push(current);
      } else {
        // 既存モデルの場合、より新しい日時のものを保持
        const existing = acc[existingIndex];
        const currentDate = new Date(current.createdAt);
        const existingDate = new Date(existing.createdAt);
        
        if (currentDate > existingDate) {
          acc[existingIndex] = current;
        }
      }
      
      return acc;
    }, []);
    
    return NextResponse.json(latestAssessments);
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessments' },
      { status: 500 }
    );
  }
}
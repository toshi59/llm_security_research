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
    
    return NextResponse.json(assessmentWithItems);
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessments' },
      { status: 500 }
    );
  }
}
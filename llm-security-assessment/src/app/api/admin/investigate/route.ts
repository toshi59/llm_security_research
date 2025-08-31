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
    
    // 一時的に認証チェックを無効化
    /*
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = AuthService.verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    */

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

    console.log('Getting security items...');
    const securityItems = await RedisService.getAllSecurityItems();
    console.log('Security items count:', securityItems.length);
    
    console.log('Starting investigation...');
    const investigationResult = await InvestigationService.investigateModel(
      modelName,
      vendor,
      securityItems
    );
    console.log('Investigation completed, items:', investigationResult.assessmentItems.length);

    console.log('Creating assessment...');
    const assessment = await RedisService.createAssessment({
      modelId: model.id,
      createdAt: new Date().toISOString(),
      createdBy: 'admin', // payload.username,
      status: 'draft',
      summary: investigationResult.overallAssessment || `Automated assessment for ${modelName}`,
    });
    console.log('Assessment created:', assessment.id);

    const createdItems = await Promise.all(
      investigationResult.assessmentItems.map((item) =>
        RedisService.createAssessmentItem({
          assessmentId: assessment.id,
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

    await RedisService.createAuditLog({
      user: 'admin', // payload.username,
      action: 'CREATE_ASSESSMENT',
      entityType: 'assessment',
      entityId: assessment.id,
      changes: {
        modelName,
        vendor,
        itemCount: createdItems.length,
      },
    });

    return NextResponse.json({
      assessment,
      model,
      items: createdItems,
      categorySummaries: investigationResult.categorySummaries,
      overallAssessment: investigationResult.overallAssessment,
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
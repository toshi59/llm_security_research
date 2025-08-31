import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RedisService } from '@/lib/redis';
import { AuthService } from '@/lib/auth';

const createAssessmentSchema = z.object({
  modelId: z.string(),
  summary: z.string(),
  items: z.array(z.object({
    itemId: z.string(),
    judgement: z.enum(['○', '×', '要改善']).nullable(),
    comment: z.string(),
    evidences: z.array(z.object({
      url: z.string(),
      title: z.string(),
      snippet: z.string(),
      confidence: z.number().optional(),
    })),
  })),
});

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = AuthService.verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { modelId, summary, items } = createAssessmentSchema.parse(body);

    const assessment = await RedisService.createAssessment({
      modelId,
      createdAt: new Date().toISOString(),
      createdBy: payload.username,
      status: 'submitted',
      summary,
    });

    const createdItems = await Promise.all(
      items.map((item) =>
        RedisService.createAssessmentItem({
          assessmentId: assessment.id,
          itemId: item.itemId,
          judgement: item.judgement,
          comment: item.comment,
          evidences: item.evidences,
          filledBy: payload.username,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      )
    );

    await RedisService.createAuditLog({
      user: payload.username,
      action: 'CREATE_ASSESSMENT',
      entityType: 'assessment',
      entityId: assessment.id,
      changes: {
        modelId,
        summary,
        itemCount: createdItems.length,
      },
    });

    return NextResponse.json({
      assessment,
      items: createdItems,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Create assessment error:', error);
    return NextResponse.json(
      { error: 'Failed to create assessment' },
      { status: 500 }
    );
  }
}
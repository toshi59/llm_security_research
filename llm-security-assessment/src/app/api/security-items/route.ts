import { NextRequest, NextResponse } from 'next/server';
import { RedisService } from '@/lib/redis';
import { seedDatabase } from '@/lib/seed';

export async function GET(_request: NextRequest) {
  try {
    await seedDatabase();
    
    const items = await RedisService.getAllSecurityItems();
    
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching security items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security items' },
      { status: 500 }
    );
  }
}
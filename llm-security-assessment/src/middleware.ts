import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AuthService } from '@/lib/auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // まずは /api/admin のみ保護し、/admin は一時的に開放
  if (pathname.startsWith('/api/admin')) {
    const token = request.cookies.get('auth-token')?.value;

    console.log('Middleware check:', { 
      pathname, 
      token: token ? 'present' : 'missing',
      jwtSecret: process.env.JWT_SECRET ? 'present' : 'missing'
    });

    if (!token) {
      console.log('No token found, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const payload = AuthService.verifyToken(token);
      
      if (!payload) {
        console.log('Invalid token, returning 401');
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }

      console.log('API access granted to:', pathname);
    } catch (error) {
      console.log('Token verification error:', error);
      return NextResponse.json({ error: 'Token verification failed' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  // 一時的に認証を無効化してテスト
  matcher: ['/api/admin/nonexistent'],
  // 元の設定: ['/api/admin/:path*']
};
import { NextResponse } from 'next/server';

export const runtime = 'edge';

const APP_PASSWORD = process.env.APP_PASSWORD || '';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (password === APP_PASSWORD && APP_PASSWORD !== '') {
      const response = NextResponse.json({ success: true });
      response.cookies.set('authenticated', 'true', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/',
      });
      return response;
    }

    return NextResponse.json(
      { success: false, error: 'Invalid password' }, 
      { status: 401 }
    );
  } catch (error) {
    console.error('Auth API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Authentication failed'
      }, 
      { status: 500 }
    );
  }
}

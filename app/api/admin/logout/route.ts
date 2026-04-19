import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const url = new URL('/admin/login', request.url)
  const response = NextResponse.redirect(url)
  response.cookies.set('admin_auth', '', { maxAge: 0, path: '/' })
  return response
}

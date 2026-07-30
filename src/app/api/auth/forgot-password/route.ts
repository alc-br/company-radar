import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { email } })
    if (!user) {
      // Return success even if user doesn't exist to prevent email enumeration
      return NextResponse.json({ message: 'If the email exists, a reset link has been sent' })
    }

    // Generate random token
    const token = Buffer.from(`${Date.now()}-${Math.random().toString(36).slice(2)}`).toString('base64url')
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    await db.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetExpires },
    })

    return NextResponse.json({ message: 'If the email exists, a reset link has been sent' })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
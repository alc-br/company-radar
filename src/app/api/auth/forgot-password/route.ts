import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function generateResetToken(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'E-mail é obrigatório' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Always find user but don't reveal existence
    const user = await db.user.findUnique({ where: { email: normalizedEmail } })

    if (user) {
      const token = generateResetToken()
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      await db.user.update({
        where: { id: user.id },
        data: { resetToken: token, resetExpires },
      })

      // In production, send email with reset link here
      // console.log(`Reset token for ${user.email}: ${token}`)
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      message: 'Se o e-mail estiver cadastrado, um link de redefinição será enviado.',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Erro ao processar solicitação. Tente novamente.' },
      { status: 500 }
    )
  }
}

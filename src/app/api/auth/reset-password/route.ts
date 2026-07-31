import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token e nova senha são obrigatórios' },
        { status: 400 }
      )
    }

    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'A nova senha deve ter no mínimo 8 caracteres' },
        { status: 400 }
      )
    }

    // Find user by reset token
    const user = await db.user.findUnique({ where: { resetToken: token } })
    if (!user) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 400 }
      )
    }

    // Check if token is not expired
    if (!user.resetExpires || user.resetExpires < new Date()) {
      return NextResponse.json(
        { error: 'Token expirado. Solicite uma nova redefinição de senha.' },
        { status: 400 }
      )
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10)

    // Update user — clear token and set new password
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetExpires: null,
      },
    })

    return NextResponse.json({
      message: 'Senha alterada com sucesso. Você já pode fazer login.',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Erro ao redefinir senha. Tente novamente.' },
      { status: 500 }
    )
  }
}

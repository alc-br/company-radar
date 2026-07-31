import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const notifications = await db.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
    const unread = await db.notification.count({ where: { read: false } })
    return NextResponse.json({ notifications, unread })
  } catch {
    return NextResponse.json({ error: 'Erro' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { ids } = await request.json() as { ids: string[] }
    await db.notification.updateMany({
      where: { id: { in: ids } },
      data: { read: true },
    })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro' }, { status: 500 })
  }
}
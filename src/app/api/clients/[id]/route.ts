import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const client = await db.client.findUnique({
      where: { id },
      include: {
        contacts: { orderBy: { createdAt: 'desc' } },
        tasks: { orderBy: { updatedAt: 'desc' }, take: 20 },
        documents: { orderBy: { updatedAt: 'desc' }, take: 20 },
        _count: { select: { tasks: true, documents: true, contacts: true } },
      },
    })
    if (!client) return NextResponse.json({ error: 'Nao encontrado' }, { status: 404 })
    return NextResponse.json(client)
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const client = await db.client.update({ where: { id }, data: body })
    return NextResponse.json(client)
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.client.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao excluir' }, { status: 500 })
  }
}
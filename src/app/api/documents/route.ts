import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId') || ''
    const status = searchParams.get('status') || ''
    const typeId = searchParams.get('typeId') || ''

    const where: Record<string, unknown> = {}
    if (clientId) where.clientId = clientId
    if (status) where.status = status
    if (typeId) where.typeId = typeId

    const documents = await db.document.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        client: { select: { id: true, name: true, tradeName: true } },
        documentType: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error('Documents GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, clientId, typeId, status, dueDate, filePath, fileSize, mimeType, notes } = body

    if (!name || !clientId) {
      return NextResponse.json({ error: 'Name and clientId are required' }, { status: 400 })
    }

    const document = await db.document.create({
      data: {
        organizationId: body.organizationId || 'org-default',
        name,
        clientId,
        typeId: typeId || null,
        status: status || 'pending',
        dueDate: dueDate ? new Date(dueDate) : null,
        filePath: filePath || null,
        fileSize: fileSize || null,
        mimeType: mimeType || null,
        notes: notes || null,
      },
      include: {
        client: { select: { id: true, name: true, tradeName: true } },
        documentType: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error('Documents POST error:', error)
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {}
    if (clientId) where.clientId = clientId
    if (status) where.status = status

    const [requests, total] = await Promise.all([
      db.documentRequest.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, name: true, tradeName: true } },
        },
      }),
      db.documentRequest.count({ where }),
    ])

    return NextResponse.json({ requests, total, page, limit, pages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('Document Requests GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch document requests' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, instructions, clientId, dueDate, acceptedFormats, requestedBy, organizationId } = body

    if (!title || !clientId) {
      return NextResponse.json({ error: 'Title and clientId are required' }, { status: 400 })
    }

    const docRequest = await db.documentRequest.create({
      data: {
        organizationId: organizationId || 'org-default',
        title,
        instructions: instructions || null,
        clientId,
        requestedBy: requestedBy || null,
        dueDate: dueDate || null,
        acceptedFormats: acceptedFormats || 'pdf,doc,docx,xls,xlsx,jpg,png',
        status: 'solicitado',
      },
      include: {
        client: { select: { id: true, name: true, tradeName: true } },
      },
    })

    return NextResponse.json(docRequest, { status: 201 })
  } catch (error) {
    console.error('Document Requests POST error:', error)
    return NextResponse.json({ error: 'Failed to create document request' }, { status: 500 })
  }
}

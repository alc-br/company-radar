import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId') || ''
    const status = searchParams.get('status') || ''
    const typeId = searchParams.get('typeId') || ''
    const search = searchParams.get('search') || ''
    const responsibleId = searchParams.get('responsibleId') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {}
    if (clientId) where.clientId = clientId
    if (status) where.status = status
    if (typeId) where.typeId = typeId
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { client: { name: { contains: search } } },
        { documentType: { name: { contains: search } } },
      ]
    }
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, unknown> = {}
      if (dateFrom) dateFilter.gte = new Date(dateFrom)
      if (dateTo) dateFilter.lte = new Date(dateTo)
      where.updatedAt = dateFilter
    }

    const [documents, total] = await Promise.all([
      db.document.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          client: { select: { id: true, name: true, tradeName: true } },
          documentType: { select: { id: true, name: true, category: true, allowedFormats: true } },
        },
      }),
      db.document.count({ where }),
    ])

    return NextResponse.json({ documents, total, page, limit, pages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('Documents GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const name = formData.get('name') as string
      const clientId = formData.get('clientId') as string
      const typeId = (formData.get('typeId') as string) || null
      const notes = (formData.get('notes') as string) || null
      const file = formData.get('file') as File | null

      if (!name || !clientId) {
        return NextResponse.json({ error: 'Name and clientId are required' }, { status: 400 })
      }

      let filePath: string | null = null
      let fileSize: number | null = null
      let mimeType: string | null = null

      if (file && file.size > 0) {
        const uploadsDir = path.join(process.cwd(), 'uploads')
        await mkdir(uploadsDir, { recursive: true })
        const ext = path.extname(file.name) || '.bin'
        const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
        filePath = `uploads/${safeName}`
        fileSize = file.size
        mimeType = file.type
        const bytes = await file.arrayBuffer()
        await writeFile(path.join(process.cwd(), filePath), Buffer.from(bytes))
      }

      const document = await db.document.create({
        data: {
          organizationId: 'org-default',
          name,
          clientId,
          typeId,
          status: 'recebido',
          filePath,
          fileSize,
          mimeType,
          notes,
        },
        include: {
          client: { select: { id: true, name: true, tradeName: true } },
          documentType: { select: { id: true, name: true } },
        },
      })

      return NextResponse.json(document, { status: 201 })
    }

    const body = await request.json()
    const { name, clientId, typeId, status, competence, issueDate, validityDate, filePath: fp, fileSize, mimeType, notes } = body

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
        competence: competence || null,
        issueDate: issueDate || null,
        validityDate: validityDate || null,
        filePath: fp || null,
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

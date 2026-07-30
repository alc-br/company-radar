import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const client = await db.client.findUnique({
      where: { id },
      include: {
        contacts: { orderBy: { createdAt: 'desc' } },
        tasks: {
          orderBy: { updatedAt: 'desc' },
          take: 20,
          include: {
            checklist: { orderBy: { order: 'asc' } },
            comments: { orderBy: { createdAt: 'asc' } },
          },
        },
        documents: { orderBy: { updatedAt: 'desc' }, take: 20 },
        tags: { include: { tag: true } },
        _count: { select: { tasks: true, documents: true, contacts: true } },
      },
    })
    if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const { tags, ...rest } = client
    return NextResponse.json({ ...rest, tagsList: tags.map(ct => ct.tag) })
  } catch (error) {
    console.error('Failed to fetch client:', error)
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { tags, addTags, removeTags, ...updateData } = body

    // Update client fields
    await db.client.update({
      where: { id },
      data: updateData,
    })

    // Replace all tags if `tags` array is provided
    if (tags && Array.isArray(tags)) {
      await db.clientTag.deleteMany({ where: { clientId: id } })
      if (tags.length > 0) {
        await db.clientTag.createMany({
          data: tags.map((tagId: string) => ({ clientId: id, tagId })),
        })
      }
    }

    // Add specific tags
    if (addTags && Array.isArray(addTags)) {
      await db.clientTag.createMany({
        data: addTags.map((tagId: string) => ({ clientId: id, tagId })),
      })
    }

    // Remove specific tags
    if (removeTags && Array.isArray(removeTags)) {
      await db.clientTag.deleteMany({
        where: {
          clientId: id,
          tagId: { in: removeTags },
        },
      })
    }

    // Fetch updated client with tags
    const result = await db.client.findUnique({
      where: { id },
      include: {
        tags: { include: { tag: true } },
        contacts: { select: { id: true, name: true, email: true, role: true } },
        _count: { select: { tasks: true, documents: true } },
      },
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to update client:', error)
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.client.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete client:', error)
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
  }
}

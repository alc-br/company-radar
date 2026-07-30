import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''

    if (!q || q.length < 2) {
      return NextResponse.json({ clients: [], tasks: [], templates: [], contacts: [] })
    }

    const [clients, tasks, templates, contacts] = await Promise.all([
      db.client.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { cnpj: { contains: q } },
            { tradeName: { contains: q } },
          ],
        },
        take: 10,
        orderBy: { updatedAt: 'desc' },
        select: { id: true, name: true, cnpj: true, tradeName: true, city: true, state: true, status: true },
      }),
      db.task.findMany({
        where: { title: { contains: q } },
        take: 10,
        orderBy: { updatedAt: 'desc' },
        select: { id: true, title: true, status: true, priority: true, dueDate: true, clientId: true, client: { select: { name: true } } },
      }),
      db.template.findMany({
        where: { name: { contains: q } },
        take: 10,
        orderBy: { updatedAt: 'desc' },
        select: { id: true, name: true, description: true, category: true, isPublished: true },
      }),
      db.contact.findMany({
        where: { name: { contains: q } },
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, phone: true, role: true, clientId: true, client: { select: { name: true } } },
      }),
    ])

    return NextResponse.json({ clients, tasks, templates, contacts })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Failed to search' }, { status: 500 })
  }
}

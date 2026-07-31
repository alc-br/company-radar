import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const job = await db.exportJob.findUnique({
      where: { id },
    })

    if (!job) {
      return NextResponse.json({ error: 'Export job not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: job.id,
      type: job.type,
      format: job.format,
      status: job.status,
      fileSize: job.fileSize,
      filePath: job.filePath,
      downloadUrl: job.status === 'completed' && job.filePath ? `/api/exports/${id}/download` : null,
      errorMessage: job.errorMessage,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
    })
  } catch (error) {
    console.error('Export job GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch export job' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import auth from '@/lib/auth'
import { batchProgressService } from '@/lib/services/batch-progress'
import { auditLogService } from '@/lib/services/audit-log'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const session = await getAuth()
    if (!session) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { invitationIds } = await req.json()
    
    const batchId = await batchProgressService.createBatch('invitation_bulk', invitationIds.length)
    
    // Start background job
    void (async () => {
      let processed = 0
      let successful = 0
      let failed = 0
      const errors: Array<{ id: string; error: string }> = []

      for (const id of invitationIds) {
        try {
          await prisma.invitation.update({
            where: { id },
            data: { status: 'REVOKED' }
          })
          
          await auditLogService.log({
            action: 'invitation_revoked',
            performedBy: session.user.id,
            targetId: id,
            organizationId: session.organizationId
          })
          
          successful++
        } catch (error) {
          failed++
          errors.push({ id, error: (error as Error).message })
        }
        
        processed++
        await batchProgressService.updateProgress(batchId, {
          processed,
          successful,
          failed,
          errors,
          status: processed === invitationIds.length ? 'completed' : 'processing'
        })
      }
    })()

    return NextResponse.json({ batchId })
  } catch (error) {
    console.error('Bulk revocation error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

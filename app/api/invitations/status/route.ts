import { auth } from '@/lib/auth'
import { batchProgressService } from '@/lib/services/batch-progress'
import { headers } from 'next/headers'

export const runtime = 'nodejs'

export async function GET() {
  const session = await auth()
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  const headersList = headers()
  const batchId = headersList.get('batch-id')

  if (!batchId) {
    return new Response('Batch ID required', { status: 400 })
  }

  const stream = new ReadableStream({
    async start(controller) {
      const batch = await batchProgressService.getBatch(batchId)
      if (!batch) {
        controller.close()
        return
      }

      // Send initial state
      controller.enqueue(`data: ${JSON.stringify(batch)}\n\n`)

      // Subscribe to Redis pub/sub for updates
      const redis = await batchProgressService.getRedisClient()
      const channel = `batch:${batchId}`
      
      await redis.subscribe(channel, (message) => {
        controller.enqueue(`data: ${message}\n\n`)
        
        const data = JSON.parse(message)
        if (data.status === 'completed' || data.status === 'failed') {
          controller.close()
        }
      })

      // Keep connection alive
      const keepAlive = setInterval(() => {
        controller.enqueue(': keepalive\n\n')
      }, 30000)

      return () => {
        clearInterval(keepAlive)
        void redis.unsubscribe(channel)
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  })
}

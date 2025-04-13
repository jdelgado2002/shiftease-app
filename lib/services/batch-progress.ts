import { kv } from '@vercel/kv';

export interface BatchProgress {
  total: number;
  processed: number;
  status: 'processing' | 'completed' | 'failed';
  error?: string;
}

export async function createBatchProgress(batchId: string, total: number): Promise<void> {
  await kv.set(`batch:${batchId}`, {
    total,
    processed: 0,
    status: 'processing',
  });
}

export async function updateBatchProgress(batchId: string, processed: number): Promise<void> {
  const progress = await getBatchProgress(batchId);
  if (!progress) return;

  await kv.set(`batch:${batchId}`, {
    ...progress,
    processed,
    status: processed >= progress.total ? 'completed' : 'processing',
  });
}

export async function getBatchProgress(batchId: string): Promise<BatchProgress | null> {
  return await kv.get(`batch:${batchId}`);
}

export async function markBatchAsFailed(batchId: string, error: string): Promise<void> {
  const progress = await getBatchProgress(batchId);
  if (!progress) return;

  await kv.set(`batch:${batchId}`, {
    ...progress,
    status: 'failed',
    error,
  });
} 
import { Queue, Worker, QueueEvents, JobsOptions } from 'bullmq'
import IORedis from 'ioredis'

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379')

export const renderQueueName = 'render-queue'
export const renderQueue = new Queue(renderQueueName, { connection })
export const renderEvents = new QueueEvents(renderQueueName, { connection })

export async function enqueueRender(projectId: string, opts: JobsOptions = {}) {
  return renderQueue.add('render', { projectId }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: true,
    removeOnFail: false,
    ...opts,
  })
}

export function createRenderWorker(processor: (projectId: string) => Promise<void>) {
  const worker = new Worker(renderQueueName, async (job) => {
    const { projectId } = job.data as { projectId: string }
    await processor(projectId)
  }, { connection })
  return worker
}



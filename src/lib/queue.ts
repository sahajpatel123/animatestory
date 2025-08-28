import { Queue, Worker, QueueEvents, JobsOptions } from 'bullmq'
import IORedis from 'ioredis'

export const renderQueueName = 'render-queue'

export function getConnection() {
  return new IORedis(process.env.REDIS_URL || 'redis://localhost:6379')
}

export function getQueue() {
  return new Queue(renderQueueName, { connection: getConnection() })
}

export function getQueueEvents() {
  return new QueueEvents(renderQueueName, { connection: getConnection() })
}

export async function enqueueRender(projectId: string, opts: JobsOptions = {}) {
  const queue = getQueue()
  try {
    return await queue.add('render', { projectId }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
      removeOnFail: false,
      ...opts,
    })
  } finally {
    await queue.close()
  }
}

export function createRenderWorker(processor: (projectId: string) => Promise<void>) {
  const worker = new Worker(renderQueueName, async (job) => {
    const { projectId } = job.data as { projectId: string }
    await processor(projectId)
  }, { connection: getConnection() })
  return worker
}

export async function getJob(jobId: string) {
  const queue = getQueue()
  try {
    return await queue.getJob(jobId)
  } finally {
    await queue.close()
  }
}



import { redisConnection, REPORT_QUEUE_NAME } from './config';
import { getLongStayAlerts, getPredictiveForecast } from '../traceability';

const USE_REDIS = process.env.USE_REDIS === 'true';

// Singleton for the queue
let reportQueue: any = null;

// In-memory mock storage for dev without Redis
const mockJobs = new Map<string, any>();

class MockQueue {
  async add(name: string, data: any) {
    const id = `mock-${Date.now()}`;
    mockJobs.set(id, { id, state: 'waiting', progress: 0, returnvalue: null });
    
    // Process asynchronously to simulate worker
    setTimeout(async () => {
      mockJobs.set(id, { id, state: 'active', progress: 10, returnvalue: null });
      try {
        let result;
        if (data.type === 'long-stay') {
          result = await getLongStayAlerts();
        } else if (data.type === 'predictive') {
          mockJobs.set(id, { id, state: 'active', progress: 20, returnvalue: null });
          result = await getPredictiveForecast();
        } else {
          throw new Error(`Unknown report type: ${data.type}`);
        }
        mockJobs.set(id, { id, state: 'completed', progress: 100, returnvalue: result });
        console.log(`[MockWorker] Job ${id} completed`);
      } catch (error) {
        mockJobs.set(id, { id, state: 'failed', progress: 0, returnvalue: null });
        console.error(`[MockWorker] Job ${id} failed:`, error);
      }
    }, 100);
    
    return { id };
  }

  async getJob(id: string) {
    const jobData = mockJobs.get(id);
    if (!jobData) return null;
    return {
      id: jobData.id,
      progress: jobData.progress,
      returnvalue: jobData.returnvalue,
      getState: async () => jobData.state
    };
  }
}

export async function getReportQueue() {
  if (!reportQueue) {
    if (USE_REDIS) {
      const { Queue } = await import('bullmq');
      reportQueue = new Queue(REPORT_QUEUE_NAME, {
        connection: redisConnection,
      });
    } else {
      console.log('[Queue] Using MockQueue since USE_REDIS is not true');
      reportQueue = new MockQueue();
    }
  }
  return reportQueue;
}

// Global worker reference (initialized only if needed)
export let reportWorker: any = null;

/**
 * Initialize the worker only if enabled and explicitly called.
 * This prevents unwanted Redis connection attempts in dev mode.
 */
export async function initWorkerIfNeeded() {
    if (!USE_REDIS || reportWorker) return;

    try {
        console.log('[Queue] Initializing BullMQ Worker (Redis enabled)');
        const { Worker } = await import('bullmq');
        
        reportWorker = new Worker(
            REPORT_QUEUE_NAME,
            async (job) => {
                const { type, params } = job.data;
                console.log(`[ReportWorker] Starting job ${job.id} type ${type}`);
                
                try {
                    if (type === 'long-stay') {
                        await job.updateProgress(10);
                        const data = await getLongStayAlerts();
                        await job.updateProgress(100);
                        return data;
                    }
                    
                    if (type === 'predictive') {
                        await job.updateProgress(20);
                        const data = await getPredictiveForecast();
                        await job.updateProgress(100);
                        return data;
                    }
                    throw new Error(`Unknown report type: ${type}`);
                } catch (error: any) {
                    console.error(`[ReportWorker] Job ${job.id} failed:`, error);
                    throw error;
                }
            },
            {
                connection: {
                    ...redisConnection,
                    maxRetriesPerRequest: null,
                } as any,
                autorun: true,
            }
        );

        reportWorker.on('completed', (job: any) => {
            console.log(`[ReportWorker] Job ${job.id} completed`);
        });

        reportWorker.on('failed', (job: any, err: any) => {
            console.error(`[ReportWorker] Job ${job?.id} failed:`, err);
        });
    } catch (err) {
        console.error('[Queue] Failed to load BullMQ worker:', err);
    }
}

// In Next.js, we might want to trigger this in a specific entry point or just rely on the first queue access
if (USE_REDIS && typeof window === 'undefined') {
    initWorkerIfNeeded().catch(console.error);
}

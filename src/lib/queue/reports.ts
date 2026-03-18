import { Queue, Worker, Job } from 'bullmq';
import { redisConnection, REPORT_QUEUE_NAME } from './config';
import { getLongStayAlerts, getPredictiveForecast } from '../traceability';

// Singleton for the queue
let reportQueue: Queue | null = null;

export function getReportQueue() {
  if (!reportQueue) {
    reportQueue = new Queue(REPORT_QUEUE_NAME, {
      connection: redisConnection,
    });
  }
  return reportQueue;
}

// Worker implementation
export const reportWorker = new Worker(
  REPORT_QUEUE_NAME,
  async (job: Job) => {
    const { type, params } = job.data;
    
    console.log(`[ReportWorker] Starting job ${job.id} type ${type}`);
    
    try {
      if (type === 'long-stay') {
        // Simulate processing for 1M+ records if needed, but here we call the DB
        // To show progress, we could chunk it, but for now we follow the requirement
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
    connection: redisConnection,
    autorun: true,
  }
);

reportWorker.on('completed', (job) => {
  console.log(`[ReportWorker] Job ${job.id} completed`);
});

reportWorker.on('failed', (job, err) => {
  console.error(`[ReportWorker] Job ${job?.id} failed:`, err);
});

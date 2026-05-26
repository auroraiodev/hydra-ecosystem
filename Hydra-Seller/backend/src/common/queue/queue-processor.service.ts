import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue, Job } from 'bull';
import { TracingService } from '../telemetry/tracing.service';
import { StructuredLogger } from '../logging/structured-logger.service';

interface OrderProcessingJob {
  orderId: string;
  userId: string;
  operation: 'create' | 'update' | 'cancel';
  data?: any;
}

interface PaymentProcessingJob {
  orderId: string;
  paymentData: any;
  operation: 'process' | 'refund' | 'verify';
}

interface EmailNotificationJob {
  to: string;
  subject: string;
  template: string;
  data: any;
  priority?: 'high' | 'medium' | 'low';
}

interface InventoryUpdateJob {
  productId: string;
  operation: 'increase' | 'decrease' | 'reserve' | 'release';
  quantity: number;
  orderId?: string;
}

interface SearchIndexingJob {
  operation: 'create' | 'update' | 'delete';
  entityType: 'product' | 'user' | 'order';
  entityId: string;
  data?: any;
}

@Injectable()
export class QueueProcessorService implements OnModuleInit {
  constructor(
    @InjectQueue('order-processing') private orderQueue: Queue,
    @InjectQueue('payment-processing') private paymentQueue: Queue,
    @InjectQueue('email-notifications') private emailQueue: Queue,
    @InjectQueue('inventory-updates') private inventoryQueue: Queue,
    @InjectQueue('search-indexing') private searchQueue: Queue,
    private tracingService: TracingService,
    private logger: StructuredLogger,
  ) {}

  onModuleInit() {
    this.setupQueueProcessors();
    this.setupQueueListeners();
  }

  private setupQueueProcessors(): void {
    // Order processing
    this.orderQueue.process('order-creation', async (job: Job<OrderProcessingJob>) => {
      return this.tracingService.traceAsync(
        'queue',
        'process-order-creation',
        () => this.processOrderCreation(job.data),
        { 'queue.name': 'order-processing', 'job.type': 'order-creation' },
      );
    });

    this.orderQueue.process('order-cancellation', async (job: Job<OrderProcessingJob>) => {
      return this.tracingService.traceAsync(
        'queue',
        'process-order-cancellation',
        () => this.processOrderCancellation(job.data),
        { 'queue.name': 'order-processing', 'job.type': 'order-cancellation' },
      );
    });

    // Payment processing
    this.paymentQueue.process('payment-processing', async (job: Job<PaymentProcessingJob>) => {
      return this.tracingService.traceAsync(
        'queue',
        'process-payment',
        () => this.processPayment(job.data),
        { 'queue.name': 'payment-processing', 'job.type': 'payment-processing' },
      );
    });

    // Email notifications
    this.emailQueue.process('send-email', async (job: Job<EmailNotificationJob>) => {
      return this.tracingService.traceAsync('queue', 'send-email', () => this.sendEmail(job.data), {
        'queue.name': 'email-notifications',
        'job.type': 'send-email',
      });
    });

    // Inventory updates
    this.inventoryQueue.process('update-inventory', async (job: Job<InventoryUpdateJob>) => {
      return this.tracingService.traceAsync(
        'queue',
        'update-inventory',
        () => this.updateInventory(job.data),
        { 'queue.name': 'inventory-updates', 'job.type': 'update-inventory' },
      );
    });

    // Search indexing
    this.searchQueue.process('index-search', async (job: Job<SearchIndexingJob>) => {
      return this.tracingService.traceAsync(
        'queue',
        'index-search',
        () => this.indexSearch(job.data),
        { 'queue.name': 'search-indexing', 'job.type': 'index-search' },
      );
    });
  }

  private setupQueueListeners(): void {
    // Order queue listeners
    this.orderQueue.on('completed', (job: Job) => {
      this.logger.logBusinessEvent('order_job_completed', {
        orderId: job.data.orderId,
        operation: job.data.operation,
        duration: Date.now() - job.timestamp,
      });
    });

    this.orderQueue.on('failed', (job: Job, err: Error) => {
      this.logger.logBusinessEvent('order_job_failed', {
        orderId: job.data.orderId,
        operation: job.data.operation,
        error: err.message,
        attempts: job.attemptsMade,
      });
    });

    // Payment queue listeners
    this.paymentQueue.on('completed', (job: Job) => {
      this.logger.logBusinessEvent('payment_job_completed', {
        orderId: job.data.orderId,
        operation: job.data.operation,
        duration: Date.now() - job.timestamp,
      });
    });

    this.paymentQueue.on('failed', (job: Job, err: Error) => {
      this.logger.logSecurity('payment_processing_failed', 'high', {
        orderId: job.data.orderId,
        errorMessage: err.message,
        attempts: job.attemptsMade,
      });
    });

    // Email queue listeners
    this.emailQueue.on('completed', (job: Job) => {
      this.logger.logBusinessEvent('email_job_completed', {
        to: job.data.to,
        template: job.data.template,
        priority: job.data.priority || 'medium',
      });
    });

    this.emailQueue.on('failed', (job: Job, err: Error) => {
      this.logger.logBusinessEvent('email_job_failed', {
        to: job.data.to,
        template: job.data.template,
        error: err.message,
        attempts: job.attemptsMade,
      });
    });
  }

  // Job methods
  async processOrderCreation(jobData: OrderProcessingJob): Promise<void> {
    this.logger.log('Processing order creation', {
      orderId: jobData.orderId,
      userId: jobData.userId,
      context: 'QUEUE',
    });

    // Simulate order processing logic
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Here you would:
    // 1. Validate inventory
    // 2. Reserve items
    // 3. Calculate totals
    // 4. Create order in database
    // 5. Trigger payment processing

    this.logger.log('Order creation completed', {
      orderId: jobData.orderId,
      context: 'QUEUE',
    });
  }

  async processOrderCancellation(jobData: OrderProcessingJob): Promise<void> {
    this.logger.log('Processing order cancellation', {
      orderId: jobData.orderId,
      userId: jobData.userId,
      context: 'QUEUE',
    });

    // Simulate cancellation processing
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Here you would:
    // 1. Check order status
    // 2. Process refunds if needed
    // 3. Release reserved inventory
    // 4. Update order status
    // 5. Send notifications

    this.logger.log('Order cancellation completed', {
      orderId: jobData.orderId,
      context: 'QUEUE',
    });
  }

  async processPayment(jobData: PaymentProcessingJob): Promise<void> {
    this.logger.log('Processing payment', {
      orderId: jobData.orderId,
      operation: jobData.operation,
      context: 'QUEUE',
    });

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Here you would:
    // 1. Validate payment data
    // 2. Process with payment gateway
    // 3. Update order status
    // 4. Send confirmation
    // 5. Handle errors and retries

    this.logger.log('Payment processing completed', {
      orderId: jobData.orderId,
      context: 'QUEUE',
    });
  }

  async sendEmail(jobData: EmailNotificationJob): Promise<void> {
    this.logger.log('Sending email', {
      to: jobData.to,
      subject: jobData.subject,
      template: jobData.template,
      priority: jobData.priority || 'medium',
      context: 'QUEUE',
    });

    // Simulate email sending
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Here you would:
    // 1. Prepare email content
    // 2. Send via email service (SendGrid, SES, etc.)
    // 3. Track delivery status
    // 4. Handle bounces and complaints

    this.logger.log('Email sent successfully', {
      to: jobData.to,
      template: jobData.template,
      context: 'QUEUE',
    });
  }

  async updateInventory(jobData: InventoryUpdateJob): Promise<void> {
    this.logger.log('Updating inventory', {
      productId: jobData.productId,
      operation: jobData.operation,
      quantity: jobData.quantity,
      context: 'QUEUE',
    });

    // Simulate inventory update
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Here you would:
    // 1. Validate operation
    // 2. Update database
    // 3. Check stock levels
    // 4. Trigger alerts if needed

    this.logger.log('Inventory update completed', {
      productId: jobData.productId,
      operation: jobData.operation,
      context: 'QUEUE',
    });
  }

  async indexSearch(jobData: SearchIndexingJob): Promise<void> {
    this.logger.log('Indexing search data', {
      entityType: jobData.entityType,
      entityId: jobData.entityId,
      operation: jobData.operation,
      context: 'QUEUE',
    });

    // Simulate search indexing
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Here you would:
    // 1. Prepare index document
    // 2. Update search index (Elasticsearch, Algolia, etc.)
    // 3. Handle index consistency
    // 4. Monitor index health

    this.logger.log('Search indexing completed', {
      entityType: jobData.entityType,
      entityId: jobData.entityId,
      context: 'QUEUE',
    });
  }

  // Public methods for adding jobs to queues
  async addOrderJob(jobData: OrderProcessingJob, options: any = {}): Promise<Job> {
    return this.orderQueue.add('order-creation', jobData, {
      priority: 8,
      delay: options.delay || 0,
      attempts: 5,
      backoff: { type: 'exponential', delay: 2000 },
    });
  }

  async addPaymentJob(jobData: PaymentProcessingJob): Promise<Job> {
    return this.paymentQueue.add('payment-processing', jobData, {
      priority: 10,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
  }

  async addEmailJob(jobData: EmailNotificationJob): Promise<Job> {
    const priorityMap = { high: 10, medium: 5, low: 1 };
    return this.emailQueue.add('send-email', jobData, {
      priority: priorityMap[jobData.priority || 'medium'],
      delay: jobData.priority === 'low' ? 60000 : 0, // 1 minute delay for low priority
      attempts: 3,
    });
  }

  async addInventoryJob(jobData: InventoryUpdateJob): Promise<Job> {
    return this.inventoryQueue.add('update-inventory', jobData, {
      priority: 5,
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
  }

  async addSearchJob(jobData: SearchIndexingJob): Promise<Job> {
    return this.searchQueue.add('index-search', jobData, {
      priority: 1,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
  }

  // Queue health and metrics
  async getQueueHealth(): Promise<any> {
    const queues = [
      { name: 'order-processing', queue: this.orderQueue },
      { name: 'payment-processing', queue: this.paymentQueue },
      { name: 'email-notifications', queue: this.emailQueue },
      { name: 'inventory-updates', queue: this.inventoryQueue },
      { name: 'search-indexing', queue: this.searchQueue },
    ];

    const health = {};

    for (const q of queues) {
      const waiting = await q.queue.getWaiting();
      const active = await q.queue.getActive();
      const completed = await q.queue.getCompleted();
      const failed = await q.queue.getFailed();

      health[q.name] = {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        isHealthy: waiting.length < 100 && failed.length < 50,
      };
    }

    return health;
  }
}

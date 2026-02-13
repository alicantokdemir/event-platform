import { Injectable } from '@nestjs/common';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

@Injectable()
export class SqsClient {
  private readonly client: SQSClient;
  private readonly queueUrl: string;

  constructor() {
    this.queueUrl = process.env.SQS_QUEUE_URL ?? '';
    if (!this.queueUrl) throw new Error('SQS_QUEUE_URL is required');

    const region = process.env.AWS_REGION ?? 'us-east-1';
    const endpoint = process.env.SQS_ENDPOINT;
    this.client = new SQSClient(endpoint ? { region, endpoint } : { region });
  }

  async sendJson<T>(payload: T): Promise<void> {
    await this.client.send(
      new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify(payload),
      })
    );
  }
}

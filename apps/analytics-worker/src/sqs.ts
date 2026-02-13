import { Injectable } from '@nestjs/common';
import { SQSClient, ReceiveMessageCommand, DeleteMessageBatchCommand, Message } from '@aws-sdk/client-sqs';

@Injectable()
export class SqsClient {
  readonly client: SQSClient;
  readonly queueUrl: string;

  constructor() {
    this.queueUrl = process.env.SQS_QUEUE_URL ?? '';
    if (!this.queueUrl) throw new Error('SQS_QUEUE_URL is required');

    const region = process.env.AWS_REGION ?? 'us-east-1';
    const endpoint = process.env.SQS_ENDPOINT;
    this.client = new SQSClient(endpoint ? { region, endpoint } : { region });
  }

  async receive(maxNumber: number, waitSeconds: number, visibilityTimeout: number): Promise<Message[]> {
    const cmd = new ReceiveMessageCommand({
      QueueUrl: this.queueUrl,
      MaxNumberOfMessages: maxNumber,
      WaitTimeSeconds: waitSeconds,
      VisibilityTimeout: visibilityTimeout,
      MessageAttributeNames: ['All'],
    });
    const res = await this.client.send(cmd);
    return res.Messages ?? [];
  }

  async deleteBatch(messages: Message[]): Promise<void> {
    if (messages.length === 0) return;
    const entries = messages
      .map((m, idx) => (m.ReceiptHandle ? { Id: String(idx), ReceiptHandle: m.ReceiptHandle } : null))
      .filter(Boolean) as { Id: string; ReceiptHandle: string }[];

    if (entries.length === 0) return;

    await this.client.send(new DeleteMessageBatchCommand({ QueueUrl: this.queueUrl, Entries: entries }));
  }
}

#!/usr/bin/env bash
set -euo pipefail

awslocal sqs create-queue --queue-name ticket-sold-queue >/dev/null
awslocal sqs create-queue --queue-name ticket-sold-dlq >/dev/null
awslocal sqs create-queue --queue-name event-service-events-queue >/dev/null

DLQ_URL=$(awslocal sqs get-queue-url --queue-name ticket-sold-dlq --query QueueUrl --output text)
DLQ_ARN=$(awslocal sqs get-queue-attributes --queue-url "$DLQ_URL" --attribute-names QueueArn --query Attributes.QueueArn --output text)

MAIN_URL=$(awslocal sqs get-queue-url --queue-name ticket-sold-queue --query QueueUrl --output text)

ATTR_FILE="$(mktemp)"
printf '{"RedrivePolicy":"{\\"deadLetterTargetArn\\":\\"%s\\",\\"maxReceiveCount\\":\\"5\\"}"}' "$DLQ_ARN" >"$ATTR_FILE"

awslocal sqs set-queue-attributes \
  --queue-url "$MAIN_URL" \
  --attributes "file://$ATTR_FILE" \
  >/dev/null

rm -f "$ATTR_FILE"

EVENTS_URL=$(awslocal sqs get-queue-url --queue-name event-service-events-queue --query QueueUrl --output text)
echo "LocalStack SQS ready: ticket=$MAIN_URL events=$EVENTS_URL"

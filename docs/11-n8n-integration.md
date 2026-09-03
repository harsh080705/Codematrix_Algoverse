# n8n Agent Workflow Integration

This guide shows how to connect n8n workflows to AIHub so agents can run through external automation instead of only using the built-in sample fallback.

## When To Use n8n

- Multi-step agent pipelines
- Agents that call several external APIs
- Long-running workflows that need branching or retries
- Internal business automations that should be exposed as paid agents

## Recommended Architecture

The cleanest approach for this repo is:

1. Store the n8n webhook URL in the agent record as `endpoint`.
2. Keep AIHub responsible for marketplace, auth, pricing, and x402 payment handling.
3. Let n8n run the actual workflow.
4. Return a JSON result back to AIHub in the same shape the frontend expects.

That fits the current backend flow in [apps/api/src/services/agent.service.ts](../apps/api/src/services/agent.service.ts), where the server posts to `agent.endpoint` and falls back to local sample execution if the endpoint fails.

## Two Good Integration Patterns

### 1. Synchronous Agent Workflow

Use this when the agent should return a result immediately.

- AIHub receives the paid run request.
- The backend sends the request payload to an n8n webhook.
- n8n executes the workflow.
- n8n returns the final JSON response.
- AIHub stores usage, payment, and receipt data.

### 2. Asynchronous Agent Workflow

Use this when the workflow is slow or has multiple stages.

- AIHub accepts the request and creates a transaction.
- n8n starts the workflow from a webhook or scheduled trigger.
- n8n writes progress updates back to AIHub through a callback endpoint.
- AIHub marks the run complete when the final callback arrives.

## Suggested Workflow Shape

### Trigger

Use an n8n `Webhook` node as the entry point.

Example request body:

```json
{
  "agentId": "65f1abc123",
  "userId": "user-123",
  "input": {
    "text": "Summarize this document"
  },
  "context": {
    "network": "algorand:testnet",
    "currency": "USDC"
  }
}
```

### Workflow Steps

1. Validate the shared secret or signature.
2. Normalize the input with a `Set` or `Code` node.
3. Branch with `IF` or `Switch` nodes if needed.
4. Call external APIs with `HTTP Request`.
5. Transform the output into a stable JSON response.
6. Return the result with `Respond to Webhook`.

### Response Shape

Example response:

```json
{
  "summary": "Task completed successfully.",
  "result": {
    "status": "done",
    "items": ["item-1", "item-2"]
  },
  "workflowId": "n8n-workflow-abc123",
  "executionMode": "sync"
}
```

## Nodes To Use

- `Webhook` for incoming runs
- `Set` for shaping inputs
- `Code` for custom logic and validation
- `IF` and `Switch` for routing
- `HTTP Request` for calling APIs, models, or internal services
- `Wait` for delayed steps or callbacks
- `Respond to Webhook` for synchronous completion

## How To Wire It Into AIHub

### 1. Add Env Vars

Add these variables to the repo environment:

```bash
N8N_WEBHOOK_URL=https://n8n.example.com/webhook/aihub-agent
N8N_SHARED_SECRET=replace-with-a-long-random-secret
N8N_CALLBACK_URL=http://localhost:8080/api/n8n/callback
```

### 2. Set The Agent Endpoint

When creating or editing an agent in AIHub, set `endpoint` to the n8n webhook URL.

The existing developer API already supports this through:

- `PUT /developer/agents/:id/endpoint`

### 3. Keep Payment In AIHub

Let AIHub handle:

- wallet auth
- x402 challenge and settlement
- transaction storage
- receipt generation

Then call n8n only after the request is authorized or settled.

### 4. Add A Callback If You Need Async Runs

If a workflow does not finish inside the webhook request, add a callback endpoint in AIHub and let n8n POST results back when done.

Suggested callback payload:

```json
{
  "transactionId": "txn-123",
  "agentId": "65f1abc123",
  "status": "completed",
  "output": {
    "summary": "Done",
    "data": {}
  }
}
```

## Security Checklist

- Use a shared secret header between AIHub and n8n.
- Reject requests that do not match the expected signature or token.
- Do not expose unprotected public workflows for paid execution.
- Keep n8n credentials scoped to the workflow that needs them.
- Prefer private instance URLs or a reverse proxy for production.

## Practical Build Order

1. Build the n8n workflow in sync mode first.
2. Point one sample agent endpoint to the webhook.
3. Confirm the agent returns JSON and AIHub stores the run.
4. Add payment flow after the execution path works.
5. Move slow jobs to async workflow + callback mode if needed.

## Real-World Examples

You can map AIHub agents to n8n workflows like this:

- Research agent -> HTTP requests, scraping, summarization, and source cleanup
- Resume analyzer -> file parsing, scoring, and feedback generation
- Customer support agent -> ticket lookup, response drafting, and CRM updates
- Content agent -> prompt enrichment, image generation, and publishing steps

## Troubleshooting

- If AIHub falls back to sample output, the n8n webhook likely failed or returned a non-200 response.
- If the workflow runs but AIHub does not store the result, add a callback or make the execution synchronous.
- If webhook requests are rejected, check the secret header and the workflow URL.
- If the workflow needs user credentials, keep those in n8n credentials, not in the request body.

## Bottom Line

Use AIHub for marketplace, auth, pricing, payment, and receipts. Use n8n for the actual workflow execution. The agent record's `endpoint` field is the bridge between the two.

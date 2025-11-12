# QueueCTL CLI - Complete Command Reference

## Prerequisites
\`\`\`bash
npm install
\`\`\`

---

## 1. BASIC QUEUE OPERATIONS

### Enqueue a Job
\`\`\`bash
npm start -- enqueue '{"id":"job1","command":"echo Hello World","priority":1}'
\`\`\`

### View Queue Status
\`\`\`bash
npm start -- status
\`\`\`

### View All Jobs
\`\`\`bash
npm start -- list
\`\`\`

### Get Job Details
\`\`\`bash
npm start -- get-job job-uuid-here
\`\`\`

---

## 2. WORKER MANAGEMENT

### Start Workers (2 concurrent workers)
\`\`\`bash
npm start -- worker start --count 2
\`\`\`

### Start Single Worker
\`\`\`bash
npm start -- worker start --count 1
\`\`\`

### Start Workers in Background (Linux/Mac)
\`\`\`bash
npm start -- worker start --count 2 &
\`\`\`

### Stop All Workers
\`\`\`bash
npm start -- worker stop
\`\`\`

### Get Worker Status
\`\`\`bash
npm start -- worker status
\`\`\`

---

## 3. RETRY & DLQ MANAGEMENT

### View Dead Letter Queue
\`\`\`bash
npm start -- dlq list
\`\`\`

### Retry Failed Job from DLQ
\`\`\`bash
npm start -- dlq retry job-uuid-here
\`\`\`

### Clear Dead Letter Queue
\`\`\`bash
npm start -- dlq clear
\`\`\`

### Retry All DLQ Jobs
\`\`\`bash
npm start -- dlq retry-all
\`\`\`

---

## 4. CONFIGURATION

### View Current Configuration
\`\`\`bash
npm start -- config show
\`\`\`

### Update Max Retries
\`\`\`bash
npm start -- config set max-retries 5
\`\`\`

### Update Worker Count
\`\`\`bash
npm start -- config set worker-count 3
\`\`\`

### Update Retry Delay (ms)
\`\`\`bash
npm start -- config set retry-delay 2000
\`\`\`

---

## 5. TESTING

### Run All Tests
\`\`\`bash
npm test
\`\`\`

### Run Tests with Verbose Output
\`\`\`bash
npm test -- --verbose
\`\`\`

---

## 6. DEMO & EXAMPLES

### Run Interactive Demo
\`\`\`bash
npm run demo
\`\`\`

---

## COMPLETE WORKFLOW EXAMPLE

### Terminal 1 - Start Workers
\`\`\`bash
npm start -- worker start --count 2
\`\`\`

### Terminal 2 - Enqueue Multiple Jobs
\`\`\`bash
npm start -- enqueue '{"id":"task1","command":"echo Task 1","priority":1}'
npm start -- enqueue '{"id":"task2","command":"echo Task 2","priority":2}'
npm start -- enqueue '{"id":"task3","command":"echo Task 3","priority":3}'
\`\`\`

### Terminal 2 - Monitor Progress
\`\`\`bash
npm start -- status
npm start -- list
npm start -- status  # Check again
\`\`\`

### Terminal 2 - View DLQ if Jobs Failed
\`\`\`bash
npm start -- dlq list
\`\`\`

### Terminal 2 - Retry Failed Jobs
\`\`\`bash
npm start -- dlq retry-all
\`\`\`

### Terminal 1 - Graceful Shutdown (Ctrl+C)
\`\`\`
Press Ctrl+C
\`\`\`

---

## QUICK START (Copy-Paste Ready)

### One-Line Setup
\`\`\`bash
npm install && npm start -- worker start --count 2 &
\`\`\`

### Enqueue Sample Jobs
\`\`\`bash
npm start -- enqueue '{"id":"job1","command":"echo Job 1 processed"}'
npm start -- enqueue '{"id":"job2","command":"echo Job 2 processed"}'
npm start -- enqueue '{"id":"job3","command":"echo Job 3 processed"}'
\`\`\`

### Check Status
\`\`\`bash
npm start -- status
npm start -- list
\`\`\`

### Cleanup
\`\`\`bash
npm start -- worker stop
\`\`\`

---

## TROUBLESHOOTING COMMANDS

### Reset Everything (Clear Queue & DLQ)
\`\`\`bash
rm -f data/queue.json data/dlq.json data/config.json
\`\`\`

### View Data Files
\`\`\`bash
cat data/queue.json
cat data/dlq.json
cat data/config.json
\`\`\`

### Verbose Logging (in actual code)
Edit `src/queue.js` and uncomment console.log statements.

---

## WINDOWS-SPECIFIC COMMANDS

### Start Workers in Background (Windows)
\`\`\`bash
start npm start -- worker start --count 2
\`\`\`

### Clear Data (Windows)
\`\`\`bash
del data\queue.json data\dlq.json data\config.json
\`\`\`

---

## MULTI-TERMINAL WORKFLOW IN VSCODE

**Step 1:** Open 2 terminals in VSCode (Ctrl+` then Ctrl+Shift+`)

**Terminal 1:**
\`\`\`bash
npm start -- worker start --count 2
\`\`\`

**Terminal 2:**
\`\`\`bash
npm start -- enqueue '{"id":"test1","command":"echo Processing test1"}'
npm start -- status
\`\`\`

**Terminal 2 (Repeat):**
\`\`\`bash
npm start -- list
npm start -- worker status
\`\`\`

---

## BATCH OPERATIONS

### Enqueue 5 Jobs Quickly
\`\`\`bash
for i in {1..5}; do npm start -- enqueue "{\"id\":\"batch-$i\",\"command\":\"echo Batch job $i\"}"; done
\`\`\`

### Windows Batch
```batch
for /L %i in (1,1,5) do npm start -- enqueue "{\"id\":\"batch-%i\",\"command\":\"echo Batch job %i\"}"

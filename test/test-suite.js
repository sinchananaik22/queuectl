import { Queue } from "../src/queue.js"
import { WorkerManager } from "../src/worker-manager.js"
import chalk from "chalk"

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function test(name, fn) {
  try {
    await fn()
    console.log(chalk.green(`✓ ${name}`))
  } catch (err) {
    console.error(chalk.red(`✗ ${name}`), err.message)
    process.exit(1)
  }
}

async function runTests() {
  console.log(chalk.blue.bold("\n🧪 Running QueueCTL Tests\n"))

  const queue = new Queue()
  const workerManager = new WorkerManager(queue)

  // Test 1: Enqueue job
  await test("Enqueue job", async () => {
    const job = await queue.enqueue({ command: 'echo "test"', id: "test-1" })
    if (job.id !== "test-1" || job.state !== "pending") {
      throw new Error("Job enqueue failed")
    }
  })

  // Test 2: Get next job
  await test("Get next job", async () => {
    const job = await queue.getNextJob()
    if (!job || job.state !== "pending") {
      throw new Error("Get next job failed")
    }
  })

  // Test 3: Update job state
  await test("Update job state", async () => {
    await queue.updateJobState("test-1", "processing")
    const jobs = await queue.listJobs("processing")
    if (jobs.length === 0) {
      throw new Error("Update job state failed")
    }
  })

  // Test 4: Increment attempts
  await test("Increment job attempts", async () => {
    await queue.incrementJobAttempts("test-1")
    const jobs = await queue.listJobs("processing")
    if (jobs[0].attempts !== 1) {
      throw new Error("Increment attempts failed")
    }
  })

  // Test 5: Configuration
  await test("Set and get configuration", async () => {
    await queue.setConfig("max-retries", "5")
    const config = await queue.getConfig()
    if (config["max-retries"] !== "5") {
      throw new Error("Config failed")
    }
  })

  // Test 6: List jobs
  await test("List jobs by state", async () => {
    const jobs = await queue.listJobs("processing")
    if (jobs.length === 0) {
      throw new Error("List jobs failed")
    }
  })

  // Test 7: Move to DLQ
  await test("Move job to DLQ", async () => {
    await queue.moveToDLQ("test-1")
    const dlq = await queue.listDLQ()
    if (dlq.length === 0) {
      throw new Error("Move to DLQ failed")
    }
  })

  // Test 8: Retry DLQ job
  await test("Retry DLQ job", async () => {
    const job = await queue.retryDLQJob("test-1")
    if (job.state !== "pending") {
      throw new Error("Retry DLQ job failed")
    }
  })

  // Test 9: Status
  await test("Get queue status", async () => {
    const status = await queue.getStatus()
    if (!status.pending && !status.completed) {
      throw new Error("Status failed")
    }
  })

  console.log(chalk.green.bold("\n✓ All tests passed!\n"))
  process.exit(0)
}

runTests().catch((err) => {
  console.error(chalk.red("Test suite error:"), err)
  process.exit(1)
})

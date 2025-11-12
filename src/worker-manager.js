import { execSync } from "child_process"
import path from "path"
import { fileURLToPath } from "url"
import fs from "fs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const LOCK_DIR = path.join(__dirname, "..", "data", "locks")
const DATA_DIR = path.join(__dirname, "..", "data")

// Ensure locks directory exists
if (!fs.existsSync(LOCK_DIR)) {
  fs.mkdirSync(LOCK_DIR, { recursive: true })
}

let activeWorkers = 0

export class WorkerManager {
  constructor(queue) {
    this.queue = queue
    this.workers = []
    this.isRunning = false
    this.shuttingDown = false

    // Handle graceful shutdown
    process.on("SIGINT", () => this.handleShutdown())
    process.on("SIGTERM", () => this.handleShutdown())
  }

  async startWorkers(count) {
    this.isRunning = true
    activeWorkers = count

    for (let i = 0; i < count; i++) {
      this.workers.push(this.runWorker(i))
    }

    await Promise.all(this.workers)
  }

  async runWorker(id) {
    console.log(`[Worker ${id}] Started`)

    while (this.isRunning && !this.shuttingDown) {
      try {
        const job = await this.queue.getNextJob()

        if (!job) {
          // No jobs available, wait before checking again
          await this.sleep(1000)
          continue
        }

        // Try to acquire lock for job
        const lockFile = path.join(LOCK_DIR, `${job.id}.lock`)
        if (fs.existsSync(lockFile)) {
          // Job is being processed by another worker
          await this.sleep(100)
          continue
        }

        // Acquire lock
        fs.writeFileSync(lockFile, process.pid.toString())

        // Update job state to processing
        await this.queue.updateJobState(job.id, "processing")

        // Execute job
        try {
          console.log(`[Worker ${id}] Executing: ${job.id} - "${job.command}"`)
          execSync(job.command, { stdio: "inherit", timeout: 30000 })

          // Job succeeded
          await this.queue.updateJobState(job.id, "completed")
          console.log(`[Worker ${id}] Completed: ${job.id}`)
        } catch (err) {
          // Job failed
          await this.queue.incrementJobAttempts(job.id)
          const config = await this.queue.getConfig()
          const maxRetries = Number.parseInt(config["max-retries"])

          if (job.attempts >= maxRetries) {
            // Move to DLQ
            await this.queue.moveToDLQ(job.id)
            console.log(`[Worker ${id}] Moved to DLQ: ${job.id}`)
          } else {
            // Schedule retry with exponential backoff
            const backoffBase = Number.parseInt(config["backoff-base"])
            const delay = Math.pow(backoffBase, job.attempts) * 1000
            console.log(
              `[Worker ${id}] Failed: ${job.id}, retrying in ${delay / 1000}s (attempt ${job.attempts}/${maxRetries})`,
            )

            await this.queue.updateJobState(job.id, "failed", err.message)
            await this.sleep(delay)
            await this.queue.updateJobState(job.id, "pending")
          }
        } finally {
          // Release lock
          try {
            fs.unlinkSync(lockFile)
          } catch {}
        }
      } catch (err) {
        console.error(`[Worker ${id}] Error:`, err.message)
        await this.sleep(1000)
      }
    }

    console.log(`[Worker ${id}] Stopped`)
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  async stopWorkers() {
    this.isRunning = false
    this.shuttingDown = true

    // Wait for workers to finish current jobs
    const timeout = 30000 // 30 second timeout
    const startTime = Date.now()

    while (this.workers.length > 0 && Date.now() - startTime < timeout) {
      await this.sleep(100)
    }

    if (this.workers.length > 0) {
      console.log("Force stopping remaining workers...")
    }
  }

  async handleShutdown() {
    console.log("\nShutting down gracefully...")
    await this.stopWorkers()
    process.exit(0)
  }
}

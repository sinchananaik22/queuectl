import path from "path"
import { fileURLToPath } from "url"
import fs from "fs"
import { randomBytes } from "crypto"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, "../data")
const JSON_PATH = path.join(DATA_DIR, "jobs.json")

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

export class Queue {
  constructor() {
    this.initJsonStorage()
  }

  initJsonStorage() {
    if (!fs.existsSync(JSON_PATH)) {
      fs.writeFileSync(
        JSON_PATH,
        JSON.stringify({
          jobs: [],
          dlq: [],
          config: { "max-retries": "3", "backoff-base": "2" },
        }),
      )
    }
  }

  getJsonData() {
    try {
      const data = fs.readFileSync(JSON_PATH, "utf-8")
      return JSON.parse(data)
    } catch {
      return { jobs: [], dlq: [], config: { "max-retries": "3", "backoff-base": "2" } }
    }
  }

  saveJsonData(data) {
    fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2))
  }

  async enqueue(jobData) {
    const job = {
      id: jobData.id || this.generateId(),
      command: jobData.command,
      state: "pending",
      attempts: 0,
      max_retries: jobData.max_retries || 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const data = this.getJsonData()
    data.jobs.push(job)
    this.saveJsonData(data)

    return job
  }

  async getNextJob() {
    const data = this.getJsonData()
    return data.jobs.find((j) => j.state === "pending")
  }

  async updateJobState(jobId, newState, errorMessage = null) {
    const now = new Date().toISOString()
    const data = this.getJsonData()
    const job = data.jobs.find((j) => j.id === jobId)

    if (job) {
      job.state = newState
      job.updated_at = now
      if (errorMessage) job.error_message = errorMessage
      this.saveJsonData(data)
    }
  }

  async incrementJobAttempts(jobId) {
    const now = new Date().toISOString()
    const data = this.getJsonData()
    const job = data.jobs.find((j) => j.id === jobId)

    if (job) {
      job.attempts += 1
      job.updated_at = now
      this.saveJsonData(data)
    }
  }

  async moveToDLQ(jobId) {
    const data = this.getJsonData()
    const jobIndex = data.jobs.findIndex((j) => j.id === jobId)

    if (jobIndex !== -1) {
      const job = data.jobs.splice(jobIndex, 1)[0]
      job.state = "dead"
      data.dlq.push(job)
      this.saveJsonData(data)
    }
  }

  async listJobs(state = "all") {
    const data = this.getJsonData()
    return state === "all" ? data.jobs : data.jobs.filter((j) => j.state === state)
  }

  async listDLQ() {
    const data = this.getJsonData()
    return data.dlq
  }

  async retryDLQJob(jobId) {
    const data = this.getJsonData()
    const dlqIndex = data.dlq.findIndex((j) => j.id === jobId)

    if (dlqIndex === -1) throw new Error("Job not found in DLQ")

    const job = data.dlq.splice(dlqIndex, 1)[0]
    job.state = "pending"
    job.attempts = 0
    job.updated_at = new Date().toISOString()
    data.jobs.push(job)
    this.saveJsonData(data)

    return job
  }

  async setConfig(key, value) {
    const data = this.getJsonData()
    data.config[key] = String(value)
    this.saveJsonData(data)
  }

  async getConfig() {
    const data = this.getJsonData()
    return data.config
  }

  async getStatus() {
    const jobs = await this.listJobs("all")
    const dlq = await this.listDLQ()
    const config = await this.getConfig()

    const status = {
      pending: jobs.filter((j) => j.state === "pending").length,
      processing: jobs.filter((j) => j.state === "processing").length,
      completed: jobs.filter((j) => j.state === "completed").length,
      failed: jobs.filter((j) => j.state === "failed").length,
      dead: dlq.length,
      maxRetries: config["max-retries"],
      backoffBase: config["backoff-base"],
      activeWorkers: 0,
    }

    return status
  }

  generateId() {
    return randomBytes(8).toString("hex")
  }
}

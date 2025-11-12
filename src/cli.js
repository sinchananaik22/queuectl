#!/usr/bin/env node
import yargs from "yargs"
import { hideBin } from "yargs/helpers"
import { Queue } from "./queue.js"
import { WorkerManager } from "./worker-manager.js"
import chalk from "chalk"

const queue = new Queue()
const workerManager = new WorkerManager(queue)

const cli = yargs(hideBin(process.argv))
  .command(
    "enqueue <job>",
    "Add a new job to the queue",
    (yargs) => yargs.positional("job", { describe: "Job JSON object" }),
    async (argv) => {
      try {
        const jobData = JSON.parse(argv.job)
        const job = await queue.enqueue(jobData)
        console.log(chalk.green("✓ Job enqueued:"), job.id)
      } catch (err) {
        console.error(chalk.red("✗ Error:"), err.message)
        process.exit(1)
      }
    },
  )
  .command(
    "worker start",
    "Start worker processes",
    (yargs) => yargs.option("count", { alias: "c", describe: "Number of workers", default: 1, type: "number" }),
    async (argv) => {
      try {
        await workerManager.startWorkers(argv.count)
        console.log(chalk.green(`✓ Started ${argv.count} worker(s)`))
        // Keep process alive
        await new Promise(() => {})
      } catch (err) {
        console.error(chalk.red("✗ Error:"), err.message)
        process.exit(1)
      }
    },
  )
  .command("worker stop", "Stop all worker processes gracefully", {}, async (argv) => {
    try {
      await workerManager.stopWorkers()
      console.log(chalk.green("✓ All workers stopped"))
      process.exit(0)
    } catch (err) {
      console.error(chalk.red("✗ Error:"), err.message)
      process.exit(1)
    }
  })
  .command("status", "Show queue status", {}, async (argv) => {
    try {
      const status = await queue.getStatus()
      console.log(chalk.blue.bold("\n📊 Queue Status:\n"))
      console.log(chalk.cyan("  Jobs:"))
      console.log(`    Pending:    ${status.pending}`)
      console.log(`    Processing: ${status.processing}`)
      console.log(`    Completed:  ${status.completed}`)
      console.log(`    Failed:     ${status.failed}`)
      console.log(`    Dead:       ${status.dead}`)
      console.log(chalk.cyan("\n  Configuration:"))
      console.log(`    Max Retries: ${status.maxRetries}`)
      console.log(`    Backoff Base: ${status.backoffBase}`)
      console.log(`    Active Workers: ${status.activeWorkers}\n`)
    } catch (err) {
      console.error(chalk.red("✗ Error:"), err.message)
      process.exit(1)
    }
  })
  .command(
    "list",
    "List jobs by state",
    (yargs) => yargs.option("state", { alias: "s", describe: "Filter by state", default: "all", type: "string" }),
    async (argv) => {
      try {
        const jobs = await queue.listJobs(argv.state)
        if (jobs.length === 0) {
          console.log(chalk.yellow("No jobs found"))
          return
        }
        console.log(chalk.blue.bold(`\n📋 Jobs (${argv.state}):\n`))
        jobs.forEach((job, idx) => {
          console.log(chalk.cyan(`  ${idx + 1}. [${job.id}]`))
          console.log(`     Command: ${job.command}`)
          console.log(`     State: ${chalk.yellow(job.state)}`)
          console.log(`     Attempts: ${job.attempts}/${job.max_retries}`)
          console.log(`     Created: ${job.created_at}\n`)
        })
      } catch (err) {
        console.error(chalk.red("✗ Error:"), err.message)
        process.exit(1)
      }
    },
  )
  .command("dlq list", "List dead letter queue jobs", {}, async (argv) => {
    try {
      const jobs = await queue.listDLQ()
      if (jobs.length === 0) {
        console.log(chalk.yellow("DLQ is empty"))
        return
      }
      console.log(chalk.red.bold(`\n⚠️  Dead Letter Queue:\n`))
      jobs.forEach((job, idx) => {
        console.log(chalk.cyan(`  ${idx + 1}. [${job.id}]`))
        console.log(`     Command: ${job.command}`)
        console.log(`     Attempts: ${job.attempts}`)
        console.log(`     Failed at: ${job.updated_at}\n`)
      })
    } catch (err) {
      console.error(chalk.red("✗ Error:"), err.message)
      process.exit(1)
    }
  })
  .command(
    "dlq retry <id>",
    "Retry a dead letter queue job",
    (yargs) => yargs.positional("id", { describe: "Job ID" }),
    async (argv) => {
      try {
        const job = await queue.retryDLQJob(argv.id)
        console.log(chalk.green("✓ Job moved back to queue:"), job.id)
      } catch (err) {
        console.error(chalk.red("✗ Error:"), err.message)
        process.exit(1)
      }
    },
  )
  .command(
    "config set <key> <value>",
    "Set configuration",
    (yargs) =>
      yargs
        .positional("key", { describe: "Config key (max-retries, backoff-base)" })
        .positional("value", { describe: "Config value" }),
    async (argv) => {
      try {
        await queue.setConfig(argv.key, argv.value)
        console.log(chalk.green(`✓ Config updated: ${argv.key} = ${argv.value}`))
      } catch (err) {
        console.error(chalk.red("✗ Error:"), err.message)
        process.exit(1)
      }
    },
  )
  .command("config get", "Get current configuration", {}, async (argv) => {
    try {
      const config = await queue.getConfig()
      console.log(chalk.blue.bold("\n⚙️  Configuration:\n"))
      console.log(`  Max Retries:  ${config["max-retries"]}`)
      console.log(`  Backoff Base: ${config["backoff-base"]}\n`)
    } catch (err) {
      console.error(chalk.red("✗ Error:"), err.message)
      process.exit(1)
    }
  })
  .help()
  .alias("help", "h")
  .version(false)

cli.parse()

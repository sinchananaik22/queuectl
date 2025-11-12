import { Queue } from "../src/queue.js"
import chalk from "chalk"

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function demo() {
  console.log(chalk.blue.bold("\n🎬 QueueCTL Demo\n"))

  const queue = new Queue()

  // Reset config
  await queue.setConfig("max-retries", "2")
  await queue.setConfig("backoff-base", "2")

  console.log(chalk.cyan("1. Enqueuing sample jobs...\n"))

  const job1 = await queue.enqueue({
    id: "demo-success",
    command: 'echo "This job will succeed"',
    max_retries: 3,
  })
  console.log(chalk.green(`✓ Enqueued: ${job1.id}`))

  const job2 = await queue.enqueue({
    id: "demo-fail",
    command: "false",
    max_retries: 2,
  })
  console.log(chalk.green(`✓ Enqueued: ${job2.id}`))

  const job3 = await queue.enqueue({
    id: "demo-echo",
    command: 'echo "Processing demo job"',
    max_retries: 1,
  })
  console.log(chalk.green(`✓ Enqueued: ${job3.id}\n`))

  console.log(chalk.cyan("2. Current Queue Status:\n"))
  const status1 = await queue.getStatus()
  console.log(`   Pending: ${status1.pending}`)
  console.log(`   Configuration - Max Retries: ${status1.maxRetries}, Backoff Base: ${status1.backoffBase}\n`)

  console.log(chalk.cyan("3. Listing all pending jobs:\n"))
  const jobs = await queue.listJobs("pending")
  jobs.forEach((job, idx) => {
    console.log(`   ${idx + 1}. [${job.id}] - ${job.command}`)
  })

  console.log(chalk.cyan("\n4. Updating a job state:\n"))
  await queue.updateJobState("demo-success", "completed")
  console.log(chalk.green("✓ Job demo-success marked as completed"))

  console.log(chalk.cyan("\n5. Checking completion:\n"))
  const completedJobs = await queue.listJobs("completed")
  console.log(`   Completed jobs: ${completedJobs.length}\n`)

  console.log(chalk.cyan("6. Simulating retry scenario:\n"))
  await queue.updateJobState("demo-fail", "processing")
  await queue.incrementJobAttempts("demo-fail")
  console.log(chalk.yellow("   Job demo-fail attempt: 1/2"))

  await queue.incrementJobAttempts("demo-fail")
  console.log(chalk.yellow("   Job demo-fail attempt: 2/2"))

  await queue.moveToDLQ("demo-fail")
  console.log(chalk.red("✓ Job demo-fail moved to DLQ\n"))

  console.log(chalk.cyan("7. Viewing Dead Letter Queue:\n"))
  const dlq = await queue.listDLQ()
  dlq.forEach((job, idx) => {
    console.log(`   ${idx + 1}. [${job.id}] - ${job.command}`)
  })

  console.log(chalk.cyan("\n8. Retrying a DLQ job:\n"))
  await queue.retryDLQJob("demo-fail")
  console.log(chalk.green("✓ Job demo-fail moved back to queue"))

  const finalStatus = await queue.getStatus()
  console.log(chalk.cyan("\n9. Final Queue Status:\n"))
  console.log(`   Pending: ${finalStatus.pending}`)
  console.log(`   Completed: ${finalStatus.completed}`)
  console.log(`   Dead: ${finalStatus.dead}\n`)

  console.log(chalk.green.bold("✓ Demo completed successfully!\n"))
  process.exit(0)
}

demo().catch((err) => {
  console.error(chalk.red("Demo error:"), err)
  process.exit(1)
})

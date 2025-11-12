import fs from "fs"
import path from "path"

export function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), "data")
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  return dataDir
}

export function generateJobId() {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

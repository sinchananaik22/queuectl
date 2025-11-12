# QueueCTL - Background Job Queue System

A production-grade CLI-based background job queue system built with Node.js. Manage background jobs with worker processes, automatic retries with exponential backoff, and a Dead Letter Queue (DLQ) for permanently failed jobs.

## Features

✨ **Core Features:**
- ✅ Enqueue and manage background jobs
- ✅ Multiple concurrent worker processes
- ✅ Automatic retry with exponential backoff
- ✅ Dead Letter Queue (DLQ) for failed jobs
- ✅ Persistent job storage (SQLite or JSON)
- ✅ Graceful shutdown
- ✅ Configurable retry policies
- ✅ Full CLI interface

## Installation & Setup

### Prerequisites
- Node.js 14.0.0 or higher

### Quick Start

1. **Clone/Setup the project:**
\`\`\`bash
# Navigate to the project directory
cd queuectl

# Install dependencies
npm install
\`\`\`

2. **Make CLI executable (optional):**
\`\`\`bash
chmod +x src/cli.js
\`\`\`

3. **Verify installation:**
\`\`\`bash
npm start -- --help
\`\`\`

## Usage

### Global Commands

#### Enqueue a Job
\`\`\`bash
npm start -- enqueue '{"id":"job1","command":"echo Hello","max_retries":3}'
\`\`\`

**Parameters:**
- `id`: Unique job identifier
- `command`: Shell command to execute
- `max_retries`: Maximum retry attempts (default: 3)

**Example:**
\`\`\`bash
npm start -- enqueue '{"id":"backup-db","command":"tar -czf backup.tar.gz /data","max_retries":2}'
\`\`\`

#### Start Workers
\`\`\`bash
npm start -- worker start --count 3
\`\`\`

**Parameters:**
- `--count` or `-c`: Number of worker processes (default: 1)

**Example:**
\`\`\`bash
npm start -- worker start -c 5
\`\`\`

Workers will:
- Pick up pending jobs sequentially
- Execute the job command
- Handle failures and retries automatically
- Gracefully shutdown on SIGINT (Ctrl+C)

#### Stop Workers
\`\`\`bash
npm start -- worker stop
\`\`\`

#### View Queue Status
\`\`\`bash
npm start -- status
\`\`\`

**Output:**
\`\`\`
📊 Queue Status:

  Jobs:
    Pending:    5
    Processing: 1
    Completed:  12
    Failed:     0
    Dead:       2

  Configuration:
    Max Retries: 3
    Backoff Base: 2

  Active Workers: 0
\`\`\`

#### List Jobs by State
\`\`\`bash
npm start -- list --state pending
\`\`\`

**States:** `pending`, `processing`, `completed`, `failed`, `all`

#### Dead Letter Queue (DLQ)

**View DLQ:**
\`\`\`bash
npm start -- dlq list
\`\`\`

**Retry a DLQ Job:**
\`\`\`bash
npm start -- dlq retry job1
\`\`\`

#### Configuration

**Set Configuration:**
\`\`\`bash
npm start -- config set max-retries 5
npm start -- config set backoff-base 3
\`\`\`

**Get Configuration:**
\`\`\`bash
npm start -- config get
\`\`\`

## Job Lifecycle

\`\`\`
pending → processing → completed
          ↓
          failed → pending (after backoff)
          ↓
          dead (when max_retries exceeded)
\`\`\`

### States Explained

| State | Description |
|-------|-------------|
| `pending` | Waiting to be picked up by a worker |
| `processing` | Currently being executed by a worker |
| `completed` | Successfully executed |
| `failed` | Failed but retryable (waiting for backoff delay) |
| `dead` | Permanently failed (moved to DLQ) |

## Retry & Backoff Strategy

Jobs that fail are automatically retried with **exponential backoff**.

**Formula:** `delay = backoff_base ^ attempts` seconds

**Example with backoff_base=2:**
- Attempt 1: Fails → Retry after 2^1 = 2 seconds
- Attempt 2: Fails → Retry after 2^2 = 4 seconds
- Attempt 3: Fails → Retry after 2^3 = 8 seconds
- Attempt 4: Fails → Moved to DLQ (if max_retries=3)

## Architecture

### Core Components

#### 1. **Queue System (`src/queue.js`)**
- Manages job persistence
- Supports SQLite (primary) or JSON (fallback)
- Handles job state transitions
- Configuration management

#### 2. **Worker Manager (`src/worker-manager.js`)**
- Spawns and manages worker processes
- Executes shell commands
- Implements exponential backoff retry logic
- Provides graceful shutdown

#### 3. **CLI Interface (`src/cli.js`)**
- Command-line argument parsing with yargs
- User-friendly feedback with colored output
- Error handling and validation

### Data Persistence

**SQLite (Recommended):**
- Located at `data/queue.db`
- Uses WAL mode for concurrent access
- Indexes for efficient querying

**JSON Fallback:**
- Located at `data/jobs.json`
- Automatic fallback if sqlite3 unavailable
- Same API, no code changes needed

### Concurrency Control

- **Lock File Mechanism**: Each job gets a lock file during execution
- Prevents duplicate processing across workers
- Atomic lock acquisition and release
- Safe cleanup on worker failure

## Running Tests

\`\`\`bash
npm test
\`\`\`

**Tests include:**
- Enqueue operations
- Job state transitions
- Retry logic
- DLQ operations
- Configuration management
- Status reporting

## Demo

Run an interactive demo:

\`\`\`bash
npm run demo
\`\`\`

**Demo includes:**
- Multiple job enqueuing
- State transitions
- DLQ operations
- Configuration usage

## Project Structure

\`\`\`
queuectl/
├── src/
│   ├── cli.js              # CLI command handlers
│   ├── queue.js            # Core queue system
│   ├── worker-manager.js   # Worker process management
│   └── utils.js            # Utility functions
├── test/
│   └── test-suite.js       # Test suite
├── demo/
│   └── demo.js             # Interactive demo
├── data/                   # Persistent storage (auto-created)
│   ├── queue.db           # SQLite database
│   ├── jobs.json          # JSON fallback storage
│   └── locks/             # Lock files for concurrency
├── package.json
└── README.md
\`\`\`

## Workflow Example

### Scenario: Backup and Cleanup Jobs

\`\`\`bash
# 1. Start 2 workers in background
npm start -- worker start --count 2 &

# 2. Enqueue backup job
npm start -- enqueue '{"id":"backup-1","command":"tar -czf backup-$(date +%s).tar.gz /data"}'

# 3. Enqueue cleanup job
npm start -- enqueue '{"id":"cleanup-logs","command":"find /logs -mtime +30 -delete"}'

# 4. Monitor queue status
npm start -- status

# 5. View all completed jobs
npm start -- list --state completed

# 6. Stop workers gracefully
npm start -- worker stop
\`\`\`

## Troubleshooting

### Jobs Not Being Processed

1. **Check if workers are running:**
   \`\`\`bash
   npm start -- status
   \`\`\`

2. **Verify pending jobs exist:**
   \`\`\`bash
   npm start -- list --state pending
   \`\`\`

3. **Start workers:**
   \`\`\`bash
   npm start -- worker start --count 1
   \`\`\`

### Jobs Moving to DLQ

1. **Check the failed job:**
   \`\`\`bash
   npm start -- dlq list
   \`\`\`

2. **View job details:**
   \`\`\`bash
   npm start -- list --state all
   \`\`\`

3. **Increase retry count and retry:**
   \`\`\`bash
   npm start -- config set max-retries 5
   npm start -- dlq retry job_id
   \`\`\`

### Permission Issues

If you get "command not found" errors:

\`\`\`bash
# Ensure the command exists and is in PATH
which command_name

# Try absolute path
npm start -- enqueue '{"command":"/full/path/to/command"}'
\`\`\`

## Configuration Defaults

\`\`\`
max-retries: 3      # Maximum retry attempts per job
backoff-base: 2     # Base for exponential backoff calculation
\`\`\`

## Advanced Usage

### Custom Retry Strategy

\`\`\`bash
# Increase retry attempts for critical jobs
npm start -- config set max-retries 10

# Use slower backoff (base 3: 3, 9, 27, 81 seconds)
npm start -- config set backoff-base 3

# Enqueue with custom max_retries
npm start -- enqueue '{"id":"critical","command":"important-task","max_retries":5}'
\`\`\`

### Batch Operations

\`\`\`bash
# Enqueue multiple jobs
npm start -- enqueue '{"id":"job1","command":"sleep 1"}'
npm start -- enqueue '{"id":"job2","command":"sleep 2"}'
npm start -- enqueue '{"id":"job3","command":"sleep 3"}'

# Process all
npm start -- worker start --count 3
\`\`\`

### Recovery

\`\`\`bash
# View DLQ
npm start -- dlq list

# Retry a specific job
npm start -- dlq retry failed_job_id

# Retry another failed job
npm start -- dlq retry another_failed_job_id
\`\`\`

## Performance Considerations

1. **Worker Count**: Start with CPU count (typically 1-4 for background jobs)
2. **Job Command Timeout**: Commands run with 30-second timeout
3. **Backoff Base**: Higher values = longer delays between retries
4. **Storage**: SQLite preferred for concurrent access

## Limitations & Known Issues

- Job execution timeout: 30 seconds (hardcoded)
- No built-in job scheduling or delays
- No job priority queue
- Single-machine deployment only (no distributed queue)

## Future Enhancements

- [ ] Job scheduling with cron expressions
- [ ] Job priority levels
- [ ] Distributed queue support
- [ ] Web dashboard for monitoring
- [ ] Webhook notifications
- [ ] Job output logging and retrieval
- [ ] Custom retry strategies per job
- [ ] Job dependencies

## Contributing

Feel free to fork, modify, and improve!

## License

MIT License

## Support

For issues, questions, or suggestions, please create a GitHub issue or contact support.

---

**Built with ❤️ using Node.js**

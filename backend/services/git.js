const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')
const crypto = require('crypto')

// Number of commits per contribution level
const COMMITS_PER_LEVEL = {
  1: [1, 2],
  2: [3, 4],
  3: [5, 6],
  4: [7, 10]
}

function randomInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function getCommitCount(level) {
  const range = COMMITS_PER_LEVEL[level]
  if (!range) return 0
  return randomInRange(range[0], range[1])
}

/**
 * Generate commits for the given contributions map.
 *
 * @param {Object} options
 * @param {string} options.repoUrl - SSH URL of the repository
 * @param {string} options.sshKey - SSH private key content
 * @param {string} options.userName - Git author name
 * @param {string} options.userEmail - Git author email
 * @param {Object} options.contributions - Map of { 'YYYY-MM-DD': level (1-4) }
 * @returns {{ totalCommits: number }}
 */
async function generateCommits({ repoUrl, sshKey, userName, userEmail, contributions }) {
  const id = crypto.randomBytes(8).toString('hex')
  const tmpDir = path.join(os.tmpdir(), `github-filler-${id}`)
  const keyPath = path.join(os.tmpdir(), `github-filler-key-${id}`)

  try {
    // Write SSH key to a temporary file
    fs.writeFileSync(keyPath, sshKey.trim() + '\n', { mode: 0o600 })

    const sshCommand = `ssh -i ${keyPath} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null`

    // Clone the repository
    execSync(`GIT_SSH_COMMAND="${sshCommand}" git clone "${repoUrl}" "${tmpDir}"`, {
      stdio: 'pipe',
      timeout: 60000
    })

    // Configure user
    execSync(`git config user.name "${userName}"`, { cwd: tmpDir, stdio: 'pipe' })
    execSync(`git config user.email "${userEmail}"`, { cwd: tmpDir, stdio: 'pipe' })

    const filePath = path.join(tmpDir, 'contributions.txt')

    // Sort dates chronologically and filter out future dates
    const today = new Date().toISOString().split('T')[0]
    const dates = Object.keys(contributions).filter(d => d <= today).sort()

    let totalCommits = 0

    for (const date of dates) {
      const level = contributions[date]
      const commitCount = getCommitCount(level)

      for (let i = 0; i < commitCount; i++) {
        // Randomize the time within the day
        const hour = randomInRange(9, 22)
        const minute = randomInRange(0, 59)
        const second = randomInRange(0, 59)
        const timestamp = `${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`

        // Append to file
        fs.appendFileSync(filePath, `${timestamp} contribution #${totalCommits + 1}\n`)

        // Stage and commit with the specific date
        execSync('git add -A', { cwd: tmpDir, stdio: 'pipe' })
        execSync(
          `GIT_AUTHOR_DATE="${timestamp}" GIT_COMMITTER_DATE="${timestamp}" git commit -m "contribution"`,
          { cwd: tmpDir, stdio: 'pipe' }
        )

        totalCommits++
      }
    }

    // Push to remote
    execSync(`GIT_SSH_COMMAND="${sshCommand}" git push origin HEAD`, {
      cwd: tmpDir,
      stdio: 'pipe',
      timeout: 120000
    })

    return { totalCommits }
  } finally {
    // Cleanup
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    } catch {}
    try {
      fs.unlinkSync(keyPath)
    } catch {}
  }
}

/**
 * Fetch existing contributions from a repository.
 * Returns a map of { 'YYYY-MM-DD': commitCount }.
 */
async function fetchContributions({ repoUrl, sshKey }) {
  const id = crypto.randomBytes(8).toString('hex')
  const tmpDir = path.join(os.tmpdir(), `github-filler-fetch-${id}`)
  const keyPath = path.join(os.tmpdir(), `github-filler-key-${id}`)

  try {
    fs.writeFileSync(keyPath, sshKey.trim() + '\n', { mode: 0o600 })
    const sshCommand = `ssh -i ${keyPath} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null`

    execSync(`GIT_SSH_COMMAND="${sshCommand}" git clone "${repoUrl}" "${tmpDir}"`, {
      stdio: 'pipe',
      timeout: 60000
    })

    // Get all commit author dates
    const logOutput = execSync('git log --format=%aI', {
      cwd: tmpDir,
      stdio: 'pipe',
      encoding: 'utf-8'
    })

    const dateCounts = {}
    for (const line of logOutput.trim().split('\n')) {
      if (!line) continue
      const date = line.split('T')[0]
      dateCounts[date] = (dateCounts[date] || 0) + 1
    }

    return { contributions: dateCounts }
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }) } catch {}
    try { fs.unlinkSync(keyPath) } catch {}
  }
}

/**
 * Delete contributions on specific dates by rewriting git history.
 * Uses git filter-branch to remove commits whose author date matches
 * any of the given dates, then force pushes.
 */
async function deleteContributions({ repoUrl, sshKey, datesToDelete }) {
  const id = crypto.randomBytes(8).toString('hex')
  const tmpDir = path.join(os.tmpdir(), `github-filler-del-${id}`)
  const keyPath = path.join(os.tmpdir(), `github-filler-key-${id}`)

  try {
    fs.writeFileSync(keyPath, sshKey.trim() + '\n', { mode: 0o600 })
    const sshCommand = `ssh -i ${keyPath} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null`

    execSync(`GIT_SSH_COMMAND="${sshCommand}" git clone "${repoUrl}" "${tmpDir}"`, {
      stdio: 'pipe',
      timeout: 60000
    })

    // Check if the repo has any commits at all
    let hasHead = true
    try {
      execSync('git rev-parse HEAD', { cwd: tmpDir, stdio: 'pipe' })
    } catch {
      hasHead = false
    }

    if (!hasHead) {
      return { deletedCommits: 0 }
    }

    // Count commits before
    const countBefore = execSync('git rev-list --count HEAD', {
      cwd: tmpDir, stdio: 'pipe', encoding: 'utf-8'
    }).trim()

    // Get commit hashes whose author dates match the dates to delete.
    // git log --format gives ISO dates which we can reliably parse,
    // unlike GIT_AUTHOR_DATE in filter-branch which uses epoch format.
    const logOutput = execSync('git log --format=%H%x20%aI', {
      cwd: tmpDir, stdio: 'pipe', encoding: 'utf-8'
    })

    const dateSet = new Set(datesToDelete)
    const hashesToDelete = []
    for (const line of logOutput.trim().split('\n')) {
      if (!line) continue
      const spaceIdx = line.indexOf(' ')
      const hash = line.substring(0, spaceIdx)
      const isoDate = line.substring(spaceIdx + 1)
      const datePart = isoDate.split('T')[0]
      if (dateSet.has(datePart)) {
        hashesToDelete.push(hash)
      }
    }

    const totalBefore = parseInt(countBefore)
    const deletingAll = hashesToDelete.length >= totalBefore

    let countAfter = 0

    if (deletingAll) {
      // All commits will be removed — skip filter-branch entirely
      countAfter = 0
    } else if (hashesToDelete.length > 0) {
      // Partial deletion — use filter-branch
      const hashSetPath = path.join(tmpDir, '.hashes-to-delete')
      fs.writeFileSync(hashSetPath, hashesToDelete.join('\n'))

      const filterScriptPath = path.join(tmpDir, '.filter-script.sh')
      fs.writeFileSync(filterScriptPath, [
        '#!/bin/sh',
        `if grep -qxF "$GIT_COMMIT" "${hashSetPath}"; then`,
        '  skip_commit "$@"',
        'else',
        '  git commit-tree "$@"',
        'fi'
      ].join('\n'))
      fs.chmodSync(filterScriptPath, '755')

      execSync(`git filter-branch -f --commit-filter 'source "${filterScriptPath}"' HEAD`, {
        cwd: tmpDir,
        stdio: 'pipe',
        timeout: 300000,
        env: { ...process.env, FILTER_BRANCH_SQUELCH_WARNING: '1' }
      })

      try {
        countAfter = parseInt(execSync('git rev-list --count HEAD', {
          cwd: tmpDir, stdio: 'pipe', encoding: 'utf-8'
        }).trim())
      } catch {
        countAfter = 0
      }
    } else {
      // Nothing to delete
      return { deletedCommits: 0 }
    }

    const deleted = totalBefore - countAfter

    // Force push
    if (countAfter > 0) {
      execSync(`GIT_SSH_COMMAND="${sshCommand}" git push origin HEAD --force`, {
        cwd: tmpDir,
        stdio: 'pipe',
        timeout: 120000
      })
    } else {
      // All commits deleted — push an empty branch
      execSync('git checkout --orphan empty-branch', { cwd: tmpDir, stdio: 'pipe' })
      execSync('git rm -rf . 2>/dev/null || true', { cwd: tmpDir, stdio: 'pipe', shell: true })
      const readmePath = path.join(tmpDir, 'README.md')
      fs.writeFileSync(readmePath, '# Contributions\n')
      execSync('git add -A', { cwd: tmpDir, stdio: 'pipe' })
      execSync('git commit -m "reset"', { cwd: tmpDir, stdio: 'pipe' })
      execSync(`GIT_SSH_COMMAND="${sshCommand}" git push origin empty-branch:main --force`, {
        cwd: tmpDir,
        stdio: 'pipe',
        timeout: 120000
      })
    }

    return { deletedCommits: deleted }
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }) } catch {}
    try { fs.unlinkSync(keyPath) } catch {}
  }
}

module.exports = { generateCommits, fetchContributions, deleteContributions }

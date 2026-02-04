/**
 * Generate the contribution grid for a given year,
 * matching GitHub's layout exactly.
 *
 * GitHub's graph runs from the first Sunday on or before Jan 1
 * through the last Saturday on or after Dec 31 — always full weeks.
 *
 * Returns an array of 7 arrays (rows: Sun=0 … Sat=6),
 * each containing objects { date, column } where date is 'YYYY-MM-DD'
 * and column is the week index (0-based). Cells outside the year are null.
 */
export function generateGrid(year) {
  const jan1 = new Date(year, 0, 1)
  const dec31 = new Date(year, 11, 31)

  // Start on the Sunday of the week containing Jan 1
  const startDate = new Date(jan1)
  startDate.setDate(startDate.getDate() - startDate.getDay())

  // End on the Saturday of the week containing Dec 31
  const endDate = new Date(dec31)
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()))

  const rows = Array.from({ length: 7 }, () => [])
  let col = 0
  const cursor = new Date(startDate)

  while (cursor <= endDate) {
    const row = cursor.getDay() // 0=Sun, 6=Sat
    const y = cursor.getFullYear()
    const m = String(cursor.getMonth() + 1).padStart(2, '0')
    const d = String(cursor.getDate()).padStart(2, '0')
    const dateStr = `${y}-${m}-${d}`

    // Only include cells that belong to the target year
    const inYear = cursor.getFullYear() === year
    rows[row].push({
      date: inYear ? dateStr : null,
      column: col
    })

    // Advance column after Saturday
    if (row === 6) col++

    cursor.setDate(cursor.getDate() + 1)
  }

  return rows
}

/**
 * Get month labels with their starting column index for the grid header.
 */
export function getMonthLabels(year) {
  const grid = generateGrid(year)
  // Use the first row (Sunday) to figure out month boundaries
  const allDates = grid[0]
  const labels = []
  let lastMonth = null

  for (const cell of allDates) {
    if (!cell.date) continue
    const month = parseInt(cell.date.split('-')[1], 10)
    if (month !== lastMonth) {
      labels.push({ month, column: cell.column })
      lastMonth = month
    }
  }

  return labels
}

const MONTH_NAMES = [
  '', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
]

export function monthName(n) {
  return MONTH_NAMES[n] || ''
}

const DAY_NAMES = ['Dom', '', 'Ter', '', 'Qui', '', 'Sáb']

export function dayLabel(row) {
  return DAY_NAMES[row]
}

/**
 * Format a date string for tooltip display.
 */
export function formatDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Determines which dates are allowed for report submission
 * Rules:
 * - Today is always allowed
 * - Yesterday is allowed if it's a working day (not Saturday)
 * - If today is Sunday, Friday is also allowed (since Saturday is holiday)
 * - Saturday is never allowed (holiday)
 */
export function getAllowedReportDates(): { today: string; yesterday: string; friday?: string } {
  const today = new Date()
  const todayStr = today.toISOString().split("T")[0]

  // Get yesterday
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // If yesterday was Saturday, get Friday instead
  if (yesterday.getDay() === 6) { // Saturday
    yesterday.setDate(yesterday.getDate() - 1) // Go back to Friday
  }

  const yesterdayStr = yesterday.toISOString().split("T")[0]

  // Check if today is Sunday
  const isTodaySunday = today.getDay() === 0 // 0 = Sunday

  let fridayStr: string | undefined

  if (isTodaySunday) {
    // If today is Sunday, get Friday (2 days ago)
    const friday = new Date(today)
    friday.setDate(today.getDate() - 2)
    fridayStr = friday.toISOString().split("T")[0]
  }

  return {
    today: todayStr,
    yesterday: yesterdayStr,
    friday: fridayStr
  }
}

/**
 * Checks if a given date string is allowed for report submission
 */
export function isDateAllowedForReport(dateStr: string): boolean {
  const allowedDates = getAllowedReportDates()
  return dateStr === allowedDates.today ||
    dateStr === allowedDates.yesterday ||
    dateStr === allowedDates.friday
}

/**
 * Gets a user-friendly message about which dates are allowed
 */
export function getAllowedDatesMessage(): string {
  const allowedDates = getAllowedReportDates()

  if (allowedDates.friday) {
    return `You can submit reports for: Today (${allowedDates.today}), Yesterday (${allowedDates.yesterday}), and Friday (${allowedDates.friday}) since Saturday was a holiday.`
  }

  return `You can submit reports for: Today (${allowedDates.today}) and Yesterday (${allowedDates.yesterday}).`
}

/**
 * Check if a date is a working day (Monday to Friday)
 */
export function isWorkingDay(date: Date): boolean {
  const day = date.getDay()
  return day >= 1 && day <= 5 // Monday to Friday
}

/**
 * Get the next working day (skipping weekends)
 */
export function getNextWorkingDay(date: Date): Date {
  const nextDay = new Date(date)
  nextDay.setDate(date.getDate() + 1)

  // If it's Saturday, go to Monday
  if (nextDay.getDay() === 6) { // Saturday
    nextDay.setDate(nextDay.getDate() + 2) // Go to Monday
  } else if (nextDay.getDay() === 0) { // Sunday
    nextDay.setDate(nextDay.getDate() + 1) // Go to Monday
  }

  return nextDay
}

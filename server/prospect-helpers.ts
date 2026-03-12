import { STATUSES, INTEREST_LEVELS } from "@shared/schema";

export function getNextStatus(currentStatus: string): string {
  const terminalStatuses = ["Offer", "Rejected", "Withdrawn"];
  if (terminalStatuses.includes(currentStatus)) {
    return currentStatus;
  }
  const index = STATUSES.indexOf(currentStatus as (typeof STATUSES)[number]);
  if (index === -1 || index >= STATUSES.length - 1) {
    return currentStatus;
  }
  const next = STATUSES[index + 1];
  if (next === "Rejected" || next === "Withdrawn") {
    return currentStatus;
  }
  return next;
}

export function validateProspect(data: Record<string, unknown>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.companyName || typeof data.companyName !== "string" || data.companyName.trim() === "") {
    errors.push("Company name is required");
  }

  if (!data.roleTitle || typeof data.roleTitle !== "string" || data.roleTitle.trim() === "") {
    errors.push("Role title is required");
  }

  if (data.status !== undefined) {
    if (!STATUSES.includes(data.status as (typeof STATUSES)[number])) {
      errors.push(`Status must be one of: ${STATUSES.join(", ")}`);
    }
  }

  if (data.interestLevel !== undefined) {
    if (!INTEREST_LEVELS.includes(data.interestLevel as (typeof INTEREST_LEVELS)[number])) {
      errors.push(`Interest level must be one of: ${INTEREST_LEVELS.join(", ")}`);
    }
  }

  if (
    data.targetSalary !== undefined &&
    data.targetSalary !== null &&
    data.targetSalary !== "" &&
    data.targetSalary !== 0
  ) {
    const n = Number(data.targetSalary);
    if (isNaN(n)) {
      errors.push("Salary must be a valid number");
    } else if (Math.round(n) < 1) {
      errors.push("Salary must be a positive number");
    }
  }

  return { valid: errors.length === 0, errors };
}

export function isTerminalStatus(status: string): boolean {
  return status === "Rejected" || status === "Withdrawn" || status === "Offer";
}

export type DeadlineUrgency = "overdue" | "urgent" | "soon" | "fine";

/**
 * Classifies the urgency of an application deadline.
 *
 * @param deadlineDateStr - ISO date string "YYYY-MM-DD"
 * @param today           - Override today's date (used in tests for determinism)
 * @returns urgency level
 *
 * Rules (based on calendar days remaining, time-of-day ignored):
 *   past           → "overdue"
 *   0 – 3 days     → "urgent"
 *   4 – 7 days     → "soon"
 *   8 + days       → "fine"
 */
export function getDeadlineUrgency(
  deadlineDateStr: string,
  today: Date = new Date(),
): DeadlineUrgency {
  const [year, month, day] = deadlineDateStr.split("-").map(Number);
  const deadlineMidnight = new Date(year, month - 1, day);
  const todayMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const diffMs = deadlineMidnight.getTime() - todayMidnight.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "overdue";
  if (diffDays <= 3) return "urgent";
  if (diffDays <= 7) return "soon";
  return "fine";
}

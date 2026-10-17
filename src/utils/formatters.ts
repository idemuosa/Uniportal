/**
 * Formats a numeric amount to Nigerian Naira (NGN) currency string.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats an ISO date string to a human-readable format.
 */
export function formatDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return 'N/A';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return 'Invalid Date';

  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Capitalizes the first letter of each word in a name string.
 */
export function capitalizeName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Computes Grade Point Average (GPA) from course scores and credit units.
 */
export function calculateGPA(courses: { score: number; units: number }[]): number {
  if (!courses || courses.length === 0) return 0.0;

  let totalPoints = 0;
  let totalUnits = 0;

  courses.forEach(course => {
    let gradePoint = 0;
    if (course.score >= 70) gradePoint = 5;
    else if (course.score >= 60) gradePoint = 4;
    else if (course.score >= 50) gradePoint = 3;
    else if (course.score >= 45) gradePoint = 2;
    else if (course.score >= 40) gradePoint = 1;

    totalPoints += gradePoint * course.units;
    totalUnits += course.units;
  });

  if (totalUnits === 0) return 0.0;
  return Math.round((totalPoints / totalUnits) * 100) / 100;
}

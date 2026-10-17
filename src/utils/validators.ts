/**
 * Validates Bank Verification Number (BVN) - 11 digits.
 */
export function isValidBVN(bvn: string): boolean {
  const cleanBVN = bvn.replace(/\D/g, '');
  return /^\d{11}$/.test(cleanBVN);
}

/**
 * Validates National Identification Number (NIN) - 11 digits.
 */
export function isValidNIN(nin: string): boolean {
  const cleanNIN = nin.replace(/\D/g, '');
  return /^\d{11}$/.test(cleanNIN);
}

/**
 * Validates standard email address format.
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates Nigerian phone numbers (e.g. 08012345678 or +2348012345678).
 */
export function isValidPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\s+/g, '');
  return /^(\+?234|0)[789][01]\d{8}$/.test(cleanPhone);
}

/**
 * Validates student matriculation number format (e.g., LUK/2025/1234).
 */
export function isValidMatricNo(matricNo: string): boolean {
  if (!matricNo) return false;
  return /^[A-Z]{2,5}\/\d{4}\/\d{3,6}$/i.test(matricNo.trim());
}

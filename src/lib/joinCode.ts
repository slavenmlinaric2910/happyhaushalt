/**
 * Generates a join code using A-Z (excluding I and O) and digits 2-9.
 * This alphabet avoids ambiguous characters (I/1, O/0) for better readability.
 *
 * @param length - The length of the join code (default: 6)
 * @returns A random join code string
 */
export function generateJoinCode(length = 6): string {
  // A-Z without I and O: A-H, J-N, P-Z (24 letters)
  // Digits: 2-9 (8 digits)
  // Total: 32 characters
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}


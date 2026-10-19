/**
 * Field rules shared by every form: names, emails and Cameroonian phone
 * numbers. Kept free of React so builders and tests can use them too.
 */

/** Every name (person, company, warehouse, role…) needs at least this many characters. */
export const MIN_NAME_LENGTH = 2;

export const isValidName = (value: string) => value.trim().length >= MIN_NAME_LENGTH;

/** local@domain.tld — letters, digits and . _ % + - before the @, a dotted domain and a 2+ letter TLD. */
export const EMAIL_PATTERN =
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;

export const isValidEmail = (value: string) => EMAIL_PATTERN.test(value.trim());

/** Cameroon's country calling code. */
export const CAMEROON_DIAL_CODE = "+237";

/** National numbers are 9 digits. */
export const CAMEROON_PHONE_DIGITS = 9;

/**
 * Mobile numbers start with 6 (62…69: MTN, Orange, Camtel, Nexttel), fixed
 * lines with 2 (22…24: Camtel).
 */
const CAMEROON_PHONE = /^(?:6[2-9]|2[2-4])\d{7}$/;

/**
 * The national digits of a phone number, whatever was typed or pasted:
 * spaces, dashes and a leading +237 / 00237 are dropped.
 */
export function phoneDigits(raw: string | null | undefined): string {
  let digits = (raw ?? "").replace(/\D/g, "");
  if (digits.startsWith("00237")) digits = digits.slice(5);
  else if (digits.startsWith("237") && digits.length > CAMEROON_PHONE_DIGITS) digits = digits.slice(3);
  return digits.slice(0, CAMEROON_PHONE_DIGITS);
}

/** Groups the national digits by three as they are typed: "677 099 845". */
export function formatPhoneInput(raw: string | null | undefined): string {
  return phoneDigits(raw).replace(/(\d{3})(?=\d)/g, "$1 ");
}

export const isValidCameroonPhone = (value: string) => CAMEROON_PHONE.test(phoneDigits(value));

/**
 * Two Cameroonian national ID cards (CNI) are in use:
 * - the 2016 card: 9 digits, e.g. 123456789;
 * - the 2025/2026 card: 10 characters, "A", then a letter or a digit, then
 *   8 digits, e.g. AB12345678 or A312345678.
 */
const CNI_2016 = /^\d{9}$/;
const CNI_2025 = /^A[A-Z0-9]\d{8}$/;

/** The longest CNI number (the 2025/2026 card). */
export const CNI_MAX_LENGTH = 10;

/** As an ID card number is typed or pasted: letters and digits only, upper-cased, at most 10. */
export const sanitizeIdCardInput = (raw: string | null | undefined) =>
  (raw ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, CNI_MAX_LENGTH);

export function isValidIdCardNumber(value: string): boolean {
  const number = value.trim().toUpperCase();
  return CNI_2016.test(number) || CNI_2025.test(number);
}

/** What is sent to the server: "+237 677 099 845", or undefined when empty. */
export function toStoredPhone(value: string): string | undefined {
  const digits = phoneDigits(value);
  return digits ? `${CAMEROON_DIAL_CODE} ${formatPhoneInput(digits)}` : undefined;
}

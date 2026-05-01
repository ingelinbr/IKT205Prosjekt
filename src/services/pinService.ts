import * as SecureStore from "expo-secure-store";
import { hashPin } from "../utils/pinUtils";

const PIN_KEY = "user_pin";
const LOGGED_IN_EMAIL_KEY = "logged_in_email";
const PIN_ATTEMPTS_KEY = "pin_attempts";
const PIN_LOCKED_UNTIL_KEY = "pin_locked_until";

const MAX_PIN_ATTEMPTS = 3;
const LOCK_TIME_MS = 5 * 60 * 1000;

export async function savePin(pin: string) {
  const hashedPin = await hashPin(pin);
  await SecureStore.setItemAsync(PIN_KEY, hashedPin);
  await resetPinLock();
}

export async function getPin() {
  return await SecureStore.getItemAsync(PIN_KEY);
}

export async function hasPin() {
  const pin = await getPin();
  return !!pin;
}

export async function getPinLockTimeLeft() {
  const lockedUntil = await SecureStore.getItemAsync(PIN_LOCKED_UNTIL_KEY);

  if (!lockedUntil) return 0;

  const timeLeft = Number(lockedUntil) - Date.now();

  if (timeLeft <= 0) {
    await resetPinLock();
    return 0;
  }

  return timeLeft;
}

export async function registerFailedPinAttempt() {
  const currentAttempts = await SecureStore.getItemAsync(PIN_ATTEMPTS_KEY);
  const attempts = Number(currentAttempts ?? 0) + 1;

  if (attempts >= MAX_PIN_ATTEMPTS) {
    await SecureStore.setItemAsync(
      PIN_LOCKED_UNTIL_KEY,
      String(Date.now() + LOCK_TIME_MS)
    );
    await SecureStore.setItemAsync(PIN_ATTEMPTS_KEY, "0");
    return true;
  }

  await SecureStore.setItemAsync(PIN_ATTEMPTS_KEY, String(attempts));
  return false;
}

export async function resetPinLock() {
  await SecureStore.deleteItemAsync(PIN_ATTEMPTS_KEY);
  await SecureStore.deleteItemAsync(PIN_LOCKED_UNTIL_KEY);
}

export async function validatePin(pin: string) {
  const timeLeft = await getPinLockTimeLeft();

  if (timeLeft > 0) {
    return false;
  }

  const savedPin = await getPin();
  if (!savedPin) return false;

  const hashedInput = await hashPin(pin);
  const isValid = savedPin === hashedInput;

  if (isValid) {
    await resetPinLock();
    return true;
  }

  await registerFailedPinAttempt();
  return false;
}

export async function saveLoggedInEmail(email: string) {
  await SecureStore.setItemAsync(LOGGED_IN_EMAIL_KEY, email);
}

export async function getLoggedInEmail() {
  return await SecureStore.getItemAsync(LOGGED_IN_EMAIL_KEY);
}

export async function clearPin() {
  await SecureStore.deleteItemAsync(PIN_KEY);
  await SecureStore.deleteItemAsync(LOGGED_IN_EMAIL_KEY);
  await resetPinLock();
}
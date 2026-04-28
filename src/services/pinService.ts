import * as SecureStore from "expo-secure-store";
import { hashPin } from "../utils/pinUtils";

const PIN_KEY = "user_pin";
const LOGGED_IN_EMAIL_KEY = "logged_in_email";

export async function savePin(pin: string) {
  const hashedPin = await hashPin(pin);
  await SecureStore.setItemAsync(PIN_KEY, hashedPin);
}

export async function getPin() {
  return await SecureStore.getItemAsync(PIN_KEY);
}

export async function hasPin() {
  const pin = await getPin();
  return !!pin;
}

export async function validatePin(pin: string) {
  const savedPin = await getPin();
  if (!savedPin) return false;

  const hashedInput = await hashPin(pin);
  return savedPin === hashedInput;
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
}
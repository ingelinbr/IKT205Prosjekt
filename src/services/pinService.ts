import * as SecureStore from 'expo-secure-store';

const PIN_KEY = 'user_pin';
const LOGGED_IN_EMAIL_KEY = 'logged_in_email';

export async function savePin(pin: string) {
  await SecureStore.setItemAsync(PIN_KEY, pin);
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
  return savedPin === pin;
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
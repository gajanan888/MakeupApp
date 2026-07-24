import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCustomerProfile } from '../api/auth';

/**
 * Derives a unique storage key for saved addresses based on the active client's identity.
 */
export const getSavedAddressesKey = async () => {
  try {
    let customerId = await AsyncStorage.getItem('customerId');
    let customerEmail = await AsyncStorage.getItem('customerEmail');

    if (!customerId && !customerEmail) {
      try {
        const token = await AsyncStorage.getItem('token');
        const role = await AsyncStorage.getItem('userRole');
        if (token && role === 'client') {
          const profile = await getCustomerProfile();
          if (profile?.id) {
            customerId = String(profile.id);
            await AsyncStorage.setItem('customerId', customerId);
          }
          if (profile?.email) {
            customerEmail = profile.email;
            await AsyncStorage.setItem('customerEmail', customerEmail);
          }
        }
      } catch (err) {
        console.warn('Failed to auto-fetch customer profile for address key:', err);
      }
    }

    if (customerId) {
      return `client_saved_addresses_${customerId}`;
    }
    if (customerEmail) {
      const cleanEmail = customerEmail.replace(/[^a-zA-Z0-9]/g, '_');
      return `client_saved_addresses_${cleanEmail}`;
    }
  } catch (err) {
    console.warn('Error reading customer identity for addresses key:', err);
  }
  return 'client_saved_addresses_guest';
};

/**
 * Retrieves all saved addresses for the current logged-in client.
 */
export const getSavedAddresses = async () => {
  try {
    const key = await getSavedAddressesKey();
    const stored = await AsyncStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed)
        ? parsed.filter(item => !String(item?.id || '').startsWith('default-'))
        : [];
    }
  } catch (err) {
    console.warn('Failed to load saved addresses:', err);
  }
  return [];
};

/**
 * Saves the given address list for the current logged-in client.
 */
export const saveAddresses = async (addresses) => {
  try {
    const key = await getSavedAddressesKey();
    const filtered = Array.isArray(addresses)
      ? addresses.filter(item => !String(item?.id || '').startsWith('default-'))
      : [];
    await AsyncStorage.setItem(key, JSON.stringify(filtered));
    return filtered;
  } catch (err) {
    console.warn('Failed to save addresses:', err);
    throw err;
  }
};

/**
 * Adds or updates an address for the current logged-in client.
 */
export const addSavedAddress = async (newAddressObj) => {
  const current = await getSavedAddresses();
  const existingIndex = current.findIndex(item => item.id === newAddressObj.id);
  let updated;
  if (existingIndex >= 0) {
    updated = [...current];
    updated[existingIndex] = newAddressObj;
  } else {
    updated = [newAddressObj, ...current];
  }
  await saveAddresses(updated);
  return updated;
};

/**
 * Deletes an address by ID for the current logged-in client.
 */
export const deleteSavedAddress = async (addressId) => {
  const current = await getSavedAddresses();
  const updated = current.filter(item => item.id !== addressId);
  await saveAddresses(updated);
  return updated;
};

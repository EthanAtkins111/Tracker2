import { Account } from './types';

export interface GeoCoords {
  latitude: number;
  longitude: number;
}

export async function geocodeAddress(query: string): Promise<GeoCoords | null> {
  // Try Photon (Komoot) first — reliable CORS support
  const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1&lang=en`;
  try {
    const res = await fetch(photonUrl);
    if (res.ok) {
      const data = await res.json();
      if (data?.features?.length > 0) {
        const [lon, lat] = data.features[0].geometry.coordinates;
        return { latitude: lat, longitude: lon };
      }
    }
  } catch { /* fall through */ }

  // Fallback: Nominatim
  const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(nominatimUrl);
    if (res.ok) {
      const data = await res.json();
      if (data?.length > 0) {
        return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
      }
    }
  } catch { /* give up */ }

  return null;
}

export function getCurrentLocation(): Promise<GeoCoords> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => reject(new Error('Unable to retrieve your location')),
      { timeout: 10000 },
    );
  });
}

const EARTH_RADIUS_KM = 6371;

export function haversineDistanceKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.asin(Math.sqrt(a));
}

export function formatDistance(km: number): string {
  return `${km.toFixed(1)} km`;
}

export async function batchGeocodeAccounts(
  accounts: Account[],
  onProgress?: (done: number, total: number) => void,
): Promise<Account[]> {
  const { editAccount } = await import('./supabase-store');

  const missing = accounts.filter(a => a.latitude == null || a.longitude == null);
  if (missing.length === 0) return accounts;

  const updated = [...accounts];
  let done = 0;

  for (const account of missing) {
    const query = [account.address, account.postalCode, account.city, 'Ontario', 'Canada']
      .filter(Boolean)
      .join(', ');
    const coords = await geocodeAddress(query);
    if (coords) {
      editAccount(account.id, coords).catch(() => {});
      const idx = updated.findIndex(a => a.id === account.id);
      if (idx !== -1) updated[idx] = { ...updated[idx], ...coords };
    }
    done++;
    onProgress?.(done, missing.length);
    if (done < missing.length) await new Promise(r => setTimeout(r, 1100));
  }

  return updated;
}

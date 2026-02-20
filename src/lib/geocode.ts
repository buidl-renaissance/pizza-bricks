const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export interface LatLng {
  lat: number;
  lng: number;
}

export async function geocodeLocation(location: string): Promise<LatLng> {
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set('q', location);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': 'pizza-bricks-outreach/1.0' },
  });

  if (!res.ok) {
    throw new Error(`Geocoding failed for "${location}": ${res.status}`);
  }

  const data = await res.json();

  if (!data.length) {
    throw new Error(`Geocoding returned no results for "${location}"`);
  }

  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

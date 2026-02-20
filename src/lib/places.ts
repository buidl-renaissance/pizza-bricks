import type { LatLng } from './geocode';

const PLACES_API = 'https://places.googleapis.com/v1/places:searchText';

interface PlacesResult {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  types?: string[];
  photos?: { name: string }[];
  reviews?: {
    text?: { text: string };
    rating?: number;
    authorAttribution?: { displayName: string };
    publishTime?: string;
  }[];
}

export async function searchGooglePlaces(
  center: LatLng,
  keyword: string,
  radiusMeters: number,
): Promise<PlacesResult[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_PLACES_API_KEY is not set');

  const fieldMask = [
    'places.id',
    'places.displayName',
    'places.formattedAddress',
    'places.internationalPhoneNumber',
    'places.websiteUri',
    'places.rating',
    'places.userRatingCount',
    'places.types',
    'places.photos',
    'places.reviews',
  ].join(',');

  const body = {
    textQuery: keyword,
    locationBias: {
      circle: {
        center: { latitude: center.lat, longitude: center.lng },
        radius: radiusMeters,
      },
    },
    maxResultCount: 20,
  };

  const res = await fetch(PLACES_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': fieldMask,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Places search failed: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.places || [];
}

export function normalizeGooglePlace(place: PlacesResult) {
  const topReviews = (place.reviews || []).slice(0, 5).map(r => ({
    text: r.text?.text || '',
    rating: r.rating || 0,
    authorName: r.authorAttribution?.displayName || 'Anonymous',
    publishTime: r.publishTime || '',
  }));

  const photoUrl = place.photos?.[0]?.name
    ? `https://places.googleapis.com/v1/${place.photos[0].name}/media?maxWidthPx=800&key=${process.env.GOOGLE_PLACES_API_KEY}`
    : null;

  return {
    googlePlaceId: place.id,
    name: place.displayName?.text || 'Unknown',
    address: place.formattedAddress || null,
    phone: place.internationalPhoneNumber || null,
    rating: place.rating?.toString() || null,
    reviewCount: place.userRatingCount || null,
    categories: JSON.stringify(place.types || []),
    hasWebsite: !!place.websiteUri,
    websiteUrl: place.websiteUri || null,
    coverPhotoUrl: photoUrl,
    topReviews: JSON.stringify(topReviews),
  };
}

const FOOD_VENDOR_TYPES = new Set([
  'restaurant', 'food', 'meal_takeaway', 'meal_delivery',
  'bakery', 'cafe', 'bar', 'night_club',
  'ice_cream_shop', 'coffee_shop', 'sandwich_shop',
  'pizza_restaurant', 'seafood_restaurant', 'steak_house',
  'sushi_restaurant', 'thai_restaurant', 'mexican_restaurant',
  'chinese_restaurant', 'indian_restaurant', 'italian_restaurant',
  'japanese_restaurant', 'korean_restaurant', 'vietnamese_restaurant',
  'american_restaurant', 'breakfast_restaurant', 'brunch_restaurant',
  'hamburger_restaurant', 'vegan_restaurant', 'vegetarian_restaurant',
]);

const NON_FOOD_NAME_PATTERNS = /\b(sales|dealer|equipment|supply|supplies|supplier|rental|rentals|manufacturing|fabrication|trailer|parts|repair|leasing|wholesale|distributor|insurance|financing|wraps?|graphics|commissary)\b/i;

/**
 * Returns true if the place is an actual food vendor / restaurant,
 * not an equipment seller, dealer, or supplier.
 */
export function isFoodVendor(place: ReturnType<typeof normalizeGooglePlace>): boolean {
  const types: string[] = JSON.parse(place.categories || '[]');

  if (NON_FOOD_NAME_PATTERNS.test(place.name)) {
    return false;
  }

  if (types.some(t => FOOD_VENDOR_TYPES.has(t))) {
    return true;
  }

  // If no food type but also no explicit non-food type, allow it —
  // some food trucks only get generic types like "point_of_interest"
  const NON_FOOD_TYPES = new Set([
    'car_dealer', 'car_repair', 'store', 'home_goods_store',
    'hardware_store', 'insurance_agency', 'real_estate_agency',
    'moving_company', 'storage', 'parking',
  ]);
  if (types.some(t => NON_FOOD_TYPES.has(t)) && !types.some(t => FOOD_VENDOR_TYPES.has(t))) {
    return false;
  }

  return true;
}

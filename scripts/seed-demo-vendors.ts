/**
 * Seed script: inserts 6 demo vendors that always appear at the top of search results.
 * Run with: npm run seed-demo
 */
import { config } from 'dotenv';
config({ path: '.env' });

import { getDb } from '../src/db/drizzle';
import { vendors } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';

const DEMO_VENDORS = [
  {
    googlePlaceId: 'demo_001',
    name: "Mia's Cocinita",
    address: '1420 Larimer St, Denver, CO 80202',
    phone: '+1 (720) 555-0101',
    rating: '4.8',
    reviewCount: 312,
    categories: JSON.stringify(['meal_takeaway', 'mexican_restaurant', 'food']),
    hasWebsite: false,
    websiteUrl: null,
    websiteQuality: 'none',
    email: 'miacocinita7@gmail.com',
    facebookPageUrl: 'https://www.facebook.com/miacocinita',
    instagramUrl: 'https://www.instagram.com/miacocinita15/',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80',
    topReviews: JSON.stringify([
      { text: 'Best street tacos in Denver! The pastor is unreal.', rating: 5, authorName: 'Carlos M.', publishTime: '2025-11-01' },
      { text: 'Mia is so sweet and the food is always fresh. My go-to every Saturday.', rating: 5, authorName: 'Sandra K.', publishTime: '2025-10-14' },
      { text: 'Huge portions and great prices. The horchata is amazing too.', rating: 5, authorName: 'Jake T.', publishTime: '2025-09-28' },
      { text: 'Hidden gem near Larimer Square. The birria quesatacos are worth the wait.', rating: 5, authorName: 'Priya S.', publishTime: '2025-09-05' },
      { text: 'Finally a food cart that gets Mexican food right. Come hungry.', rating: 4, authorName: 'Tom R.', publishTime: '2025-08-22' },
    ]),
    menuItems: JSON.stringify([
      { name: 'Street Tacos (3 pack)', description: 'Pastor, asada, or carnitas on fresh corn tortillas with onion and cilantro', price: '$9' },
      { name: 'Birria Quesatacos', description: 'Crispy cheese-fried tacos filled with slow-braised beef birria, served with consommé', price: '$13' },
      { name: 'Burrito Bowl', description: 'Rice, beans, your choice of protein, pico, guac, and sour cream', price: '$11' },
      { name: 'Elote Cup', description: 'Mexican street corn with cotija cheese, chili lime, and mayo', price: '$5' },
      { name: 'Horchata (Large)', description: 'House-made cinnamon rice milk drink', price: '$4' },
    ]),
    status: 'candidate' as const,
    notes: '__demo__',
  },
  {
    googlePlaceId: 'demo_002',
    name: "Skylar's Southern Kitchen",
    address: '3280 Downing St, Denver, CO 80205',
    phone: '+1 (720) 555-0202',
    rating: '4.7',
    reviewCount: 189,
    categories: JSON.stringify(['meal_takeaway', 'american_restaurant', 'food']),
    hasWebsite: false,
    websiteUrl: null,
    websiteQuality: 'none',
    email: null,
    facebookPageUrl: null,
    instagramUrl: 'https://www.instagram.com/skylarssouthernkitchen/',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=800&q=80',
    topReviews: JSON.stringify([
      { text: 'Skylar\'s mac and cheese is the best I\'ve ever had. Period.', rating: 5, authorName: 'DeShawn B.', publishTime: '2025-11-10' },
      { text: 'The fried chicken is crispy outside and juicy inside. This cart is legit.', rating: 5, authorName: 'Maria G.', publishTime: '2025-10-20' },
      { text: 'Portions are huge. Brought leftovers home and they were still amazing.', rating: 4, authorName: 'Chris P.', publishTime: '2025-09-15' },
    ]),
    menuItems: JSON.stringify([
      { name: 'Fried Chicken Plate', description: 'Three pieces of hand-battered fried chicken with two sides', price: '$14' },
      { name: 'Smoked Brisket Sandwich', description: 'Slow-smoked beef brisket on a brioche bun with house pickles and slaw', price: '$13' },
      { name: 'Mac & Cheese (Large)', description: 'Skylar\'s signature four-cheese baked mac', price: '$8' },
      { name: 'Collard Greens', description: 'Slow-cooked with smoked turkey and vinegar', price: '$5' },
      { name: 'Sweet Tea (32oz)', description: 'Southern-style sweet iced tea', price: '$3' },
    ]),
    status: 'candidate' as const,
    notes: '__demo__',
  },
  {
    googlePlaceId: 'demo_003',
    name: 'Taquitos Jalisco',
    address: '4501 Morrison Rd, Denver, CO 80219',
    phone: '+1 (720) 555-0303',
    rating: '4.6',
    reviewCount: 445,
    categories: JSON.stringify(['meal_takeaway', 'mexican_restaurant', 'food']),
    hasWebsite: true,
    websiteUrl: 'http://taquitosjalisco.weebly.com',
    websiteQuality: 'poor',
    email: 'taquitosjalisco@gmail.com',
    facebookPageUrl: 'https://www.facebook.com/TaquitosJaliscoDenver/',
    instagramUrl: 'https://www.instagram.com/taquitosjaliscodenver/',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&q=80',
    topReviews: JSON.stringify([
      { text: 'Best taquitos in the whole city. Crispy and perfectly seasoned.', rating: 5, authorName: 'Alejandro V.', publishTime: '2025-11-05' },
      { text: 'The salsa verde is addictive. I always order extra.', rating: 5, authorName: 'Lisa W.', publishTime: '2025-10-30' },
      { text: 'Cheap, fast, and delicious. What more do you want?', rating: 5, authorName: 'Kevin H.', publishTime: '2025-10-01' },
      { text: 'Authentic Jalisco flavor. Reminds me of home.', rating: 5, authorName: 'Rosa L.', publishTime: '2025-09-12' },
    ]),
    menuItems: JSON.stringify([
      { name: 'Taquitos (6 pack)', description: 'Crispy rolled tacos with beef or chicken, served with guac and sour cream', price: '$10' },
      { name: 'Carne Asada Tacos (3)', description: 'Grilled steak on fresh tortillas with lime and salsa', price: '$11' },
      { name: 'Tamales (2 pack)', description: 'Handmade pork or chicken tamales in corn husk', price: '$8' },
      { name: 'Chips & Salsa Bar', description: 'Fresh tortilla chips with salsa roja, verde, and guac', price: '$6' },
      { name: 'Agua Fresca', description: 'Seasonal flavors: hibiscus, tamarind, or mango', price: '$3' },
    ]),
    status: 'candidate' as const,
    notes: '__demo__',
  },
  {
    googlePlaceId: 'demo_004',
    name: "Don Sabroson Food Truck",
    address: '215 S Pecos St, Denver, CO 80223',
    phone: '+1 (720) 555-0404',
    rating: '4.5',
    reviewCount: 278,
    categories: JSON.stringify(['meal_takeaway', 'mexican_restaurant', 'food']),
    hasWebsite: false,
    websiteUrl: null,
    websiteQuality: 'none',
    email: 'donsabroson@gmail.com',
    facebookPageUrl: 'https://www.facebook.com/DonSabroson/',
    instagramUrl: null,
    coverPhotoUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80',
    topReviews: JSON.stringify([
      { text: 'The pupusas are incredible. Perfectly crispy with just the right amount of cheese.', rating: 5, authorName: 'Natalie B.', publishTime: '2025-11-08' },
      { text: 'So glad I found this truck. The enchiladas are homemade quality.', rating: 5, authorName: 'Miguel A.', publishTime: '2025-10-25' },
      { text: 'Fast service and super friendly staff. The caldo is perfect for cold days.', rating: 4, authorName: 'Erin C.', publishTime: '2025-09-19' },
    ]),
    menuItems: JSON.stringify([
      { name: 'Pupusas (2 pack)', description: 'Handmade thick corn tortillas stuffed with cheese, beans, or chicharrón', price: '$8' },
      { name: 'Enchiladas Verdes', description: 'Three enchiladas in tomatillo sauce with queso fresco and crema', price: '$12' },
      { name: 'Caldo de Res', description: 'Traditional beef and vegetable soup served with rice and tortillas', price: '$10' },
      { name: 'Tostadas (2 pack)', description: 'Crispy tostadas topped with beans, shredded chicken, lettuce, and pico', price: '$9' },
      { name: 'Champurrado', description: 'Warm chocolate-corn masa drink, perfect for cold days', price: '$4' },
    ]),
    status: 'candidate' as const,
    notes: '__demo__',
  },
  {
    googlePlaceId: 'demo_005',
    name: 'Marquez Food Truck',
    address: '2850 Welton St, Denver, CO 80205',
    phone: '+1 (720) 555-0505',
    rating: '4.4',
    reviewCount: 156,
    categories: JSON.stringify(['meal_takeaway', 'mexican_restaurant', 'food']),
    hasWebsite: true,
    websiteUrl: 'https://marquezfoodtruck.com',
    websiteQuality: 'basic',
    email: null,
    facebookPageUrl: null,
    instagramUrl: 'https://www.instagram.com/marquezfooddenver/',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
    topReviews: JSON.stringify([
      { text: 'The green chile smothered burrito is a Denver staple. So good.', rating: 5, authorName: 'Amanda S.', publishTime: '2025-11-02' },
      { text: 'Fresh ingredients, generous portions, fair prices. Will be back.', rating: 4, authorName: 'Brian D.', publishTime: '2025-10-18' },
      { text: 'The breakfast burritos are worth waking up early for.', rating: 5, authorName: 'Tasha M.', publishTime: '2025-09-29' },
    ]),
    menuItems: JSON.stringify([
      { name: 'Green Chile Burrito', description: 'Flour tortilla stuffed with pork, potatoes, and Hatch green chile', price: '$12' },
      { name: 'Breakfast Burrito', description: 'Eggs, bacon, hash browns, cheddar, and pico in a large flour tortilla', price: '$10' },
      { name: 'Loaded Nachos', description: 'Tortilla chips with beans, jalapeños, queso, guac, and your choice of protein', price: '$13' },
      { name: 'Quesadilla', description: 'Large flour tortilla with melted cheese and choice of filling', price: '$9' },
      { name: 'Horchata (Large)', description: 'House-made cinnamon rice milk', price: '$4' },
    ]),
    status: 'candidate' as const,
    notes: '__demo__',
  },
  {
    googlePlaceId: 'demo_006',
    name: 'La Sabrosita',
    address: '3390 W 38th Ave, Denver, CO 80211',
    phone: '+1 (720) 555-0606',
    rating: '4.9',
    reviewCount: 521,
    categories: JSON.stringify(['meal_takeaway', 'mexican_restaurant', 'food']),
    hasWebsite: true,
    websiteUrl: 'https://lasabrositaco.com',
    websiteQuality: 'good',
    email: 'lasabrositadenver@gmail.com',
    facebookPageUrl: 'https://www.facebook.com/lasabrositadenver/',
    instagramUrl: 'https://www.instagram.com/lasabrositaco/',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1624300629298-e9de39c13be5?w=800&q=80',
    topReviews: JSON.stringify([
      { text: 'The best Mexican food in all of Denver. No contest.', rating: 5, authorName: 'Eduardo F.', publishTime: '2025-11-12' },
      { text: 'Came three times in one week. The al pastor is unmatched.', rating: 5, authorName: 'Sophie L.', publishTime: '2025-11-01' },
      { text: 'Fresh tortillas made right in front of you. Incredible.', rating: 5, authorName: 'James O.', publishTime: '2025-10-22' },
      { text: 'Even my picky kids loved everything here. Family favorite now.', rating: 5, authorName: 'Rebecca N.', publishTime: '2025-10-10' },
      { text: 'A Denver institution. Long line but always worth the wait.', rating: 5, authorName: 'David K.', publishTime: '2025-09-30' },
    ]),
    menuItems: JSON.stringify([
      { name: 'Al Pastor Tacos (3)', description: 'Spit-roasted pork with pineapple, onion, and cilantro on fresh corn tortillas', price: '$10' },
      { name: 'Torta Cubana', description: 'Mexican sandwich with ham, milanesa, chorizo, avocado, and jalapeños', price: '$14' },
      { name: 'Pozole Rojo (Bowl)', description: 'Hearty hominy and pork soup in red chile broth with toppings', price: '$11' },
      { name: 'Sopes (2 pack)', description: 'Thick masa bases with beans, lettuce, crema, and choice of meat', price: '$9' },
      { name: 'Fresh Tortillas (dozen)', description: 'Hand-pressed corn or flour tortillas made to order', price: '$4' },
    ]),
    status: 'candidate' as const,
    notes: '__demo__',
  },
];

async function main() {
  const db = getDb();

  let inserted = 0;
  let skipped = 0;

  for (const vendor of DEMO_VENDORS) {
    const existing = await db
      .select()
      .from(vendors)
      .where(eq(vendors.googlePlaceId, vendor.googlePlaceId))
      .then(r => r[0] || null);

    if (existing) {
      console.log(`⏭  Skipping (already exists): ${vendor.name}`);
      skipped++;
      continue;
    }

    await db.insert(vendors).values({
      id: uuid(),
      ...vendor,
    });

    console.log(`✓  Inserted: ${vendor.name}`);
    inserted++;
  }

  console.log(`\nDone — ${inserted} inserted, ${skipped} skipped.`);
  process.exit(0);
}

main().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});

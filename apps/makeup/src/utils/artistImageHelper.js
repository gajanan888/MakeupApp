// Helper utility for generating unique high-res Unsplash photos for artist profiles & portfolios

const femaleProfilePhotos = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1548142813-c348350df52b?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1542103749-8ef59b94f47e?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534751516642-a171e261f52a?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500840216050-6ffa99d75160?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=500&auto=format&fit=crop&q=80',
];

const maleProfilePhotos = [
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=500&auto=format&fit=crop&q=80',
];

const portfolioGalleryPool = [
  {
    tag: 'Bridal',
    description: 'Royal Red Lehenga & Traditional Heavy Gold Bridal HD Makeup.',
    before: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80',
    after: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80',
    extra: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80',
    ]
  },
  {
    tag: 'South Indian Bridal',
    description: 'Traditional Silk Saree & Temple Jewelry Muhurtham Bridal Styling.',
    before: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&auto=format&fit=crop&q=80',
    after: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    extra: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&auto=format&fit=crop&q=80'
    ]
  },
  {
    tag: 'Haldi & Mehendi',
    description: 'Fresh Floral & Sunshine Yellow Pastel Glow for pre-wedding functions.',
    before: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&auto=format&fit=crop&q=80',
    after: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
    extra: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&auto=format&fit=crop&q=80'
    ]
  },
  {
    tag: 'Nauvari Traditional',
    description: 'Classic Maharashtrian Traditional Bridal look with Chandrakor bindi.',
    before: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&auto=format&fit=crop&q=80',
    after: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80',
    extra: [
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80'
    ]
  },
  {
    tag: 'Reception Cocktail Glam',
    description: 'Glitter Smokey Eye art with airbrush porcelain finish.',
    before: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&auto=format&fit=crop&q=80',
    after: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&auto=format&fit=crop&q=80',
    extra: [
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80'
    ]
  },
  {
    tag: 'Rajwadi Heritage Bridal',
    description: 'Traditional Rajasthani Bride makeover with Kundan jewels & Borla.',
    before: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&auto=format&fit=crop&q=80',
    after: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80',
    extra: [
      'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1503104834685-7205e8607eb9?w=600&auto=format&fit=crop&q=80'
    ]
  },
  {
    tag: 'Engagement Soft Glam',
    description: 'Ultra-HD Dewy finish and soft winged liner for engagement ceremony.',
    before: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80',
    after: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&auto=format&fit=crop&q=80',
    extra: [
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&auto=format&fit=crop&q=80'
    ]
  },
  {
    tag: 'HD Airbrush Bridal',
    description: 'Flawless 3D Airbrush waterproof base for all day comfort.',
    before: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&auto=format&fit=crop&q=80',
    after: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=600&auto=format&fit=crop&q=80',
    extra: [
      'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&auto=format&fit=crop&q=80'
    ]
  },
];

function getStringHash(str) {
  let hash = 0;
  if (!str) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getUniqueProfileImage(artist) {
  if (artist?.profile?.profileImage) {
    return artist.profile.profileImage;
  }
  if (typeof artist?.image === 'string') {
    return artist.image;
  }
  if (artist?.image?.uri) {
    return artist.image.uri;
  }

  const id = artist?.id || 1;
  const name = artist?.name || 'Artist';
  const hash = getStringHash(`${id}_${name}`);
  const isMale = artist?.profile?.gender?.toLowerCase() === 'male' || name.toLowerCase().includes('rohan') || name.toLowerCase().includes('kabir');

  if (isMale) {
    return maleProfilePhotos[hash % maleProfilePhotos.length];
  } else {
    return femaleProfilePhotos[hash % femaleProfilePhotos.length];
  }
}

export function getUniquePortfolio(artist) {
  const existing = Array.isArray(artist?.portfolio) ? artist.portfolio : [];

  // Parse any JSON stringified images in existing portfolio items
  const parsedExisting = existing.map(item => {
    let images = item.images;
    if (typeof images === 'string') {
      try {
        images = JSON.parse(images);
      } catch (e) {
        images = [images];
      }
    }
    return { ...item, images };
  });

  // Reverse so newest uploaded work is at the beginning (top left)
  const reversedExisting = [...parsedExisting].reverse();

  // If the artist has uploaded any of their own work, return their real portfolio!
  if (reversedExisting.length > 0) {
    return reversedExisting;
  }

  // Fallback to pool items only if artist has NO portfolio items uploaded yet
  const id = artist?.id || 1;
  const name = artist?.name || 'Artist';
  const hash = getStringHash(`${id}_${name}`);

  const items = [];
  for (let i = 0; i < 4; i++) {
    const idx = (hash + i * 3) % portfolioGalleryPool.length;
    const poolItem = portfolioGalleryPool[idx];
    items.push({
      id: `generated_${id}_${i}`,
      beforeImageUrl: poolItem.before,
      afterImageUrl: poolItem.after,
      tag: poolItem.tag,
      description: poolItem.description,
      images: poolItem.extra,
    });
  }

  return items;
}

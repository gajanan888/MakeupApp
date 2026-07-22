// Pre-calculated Trending Artists Dataset
// Prepared and cached in code to avoid repetitive backend calculation overhead

export const PRECALCULATED_TRENDING_ARTISTS = [
  {
    id: 101,
    name: "Sunita Verma Artistry",
    email: "sunita.verma@makeupglam.in",
    phone: "9820001001",
    isVerified: true,
    trendingRank: 1,
    profile: {
      id: 101,
      artistId: 101,
      profileImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80",
      gender: "Female",
      bio: "Master celebrity & HD bridal makeup artist with over 10 years of experience across Bollywood & High-fashion weddings.",
      location: "Mumbai",
      experience: "10",
      parlourName: "Sunita Verma Glam Studio",
      parlourAddress: "Juhu Tara Road, Juhu, Mumbai",
      rating: 4.9,
      reviewCount: 342
    },
    specializations: [
      { id: 1, name: "Celebrity Glam" },
      { id: 2, name: "HD Airbrush Bridal" },
      { id: 3, name: "Royal Reception Look" }
    ],
    services: [
      { id: 1001, specialization: "HD Airbrush Bridal", duration: "3.5 hrs", timeRange: "8 AM - 2 PM", priceRange: "₹25,000" },
      { id: 1002, specialization: "Celebrity Party Glam", duration: "2 hrs", timeRange: "10 AM - 8 PM", priceRange: "₹15,000" }
    ],
    portfolio: [
      {
        id: 2001,
        beforeImageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80",
        afterImageUrl: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&auto=format&fit=crop&q=80",
        tag: "Royal Mumbai Bridal",
        description: "Signature Royal HD Airbrush Bridal styling in Mumbai."
      }
    ]
  },
  {
    id: 102,
    name: "Rohan Kapoor Glam Studio",
    email: "rohan.kapoor@makeupglam.in",
    phone: "9820001002",
    isVerified: true,
    trendingRank: 2,
    profile: {
      id: 102,
      artistId: 102,
      profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80",
      gender: "Male",
      bio: "Top-ranked editorial & destination wedding makeup specialist based in Delhi. Known for natural glow & sharp contouring.",
      location: "Delhi",
      experience: "8",
      parlourName: "Rohan Kapoor Couture Beauty",
      parlourAddress: "South Extension II, New Delhi",
      rating: 4.8,
      reviewCount: 289
    },
    specializations: [
      { id: 4, name: "Destination Bridal" },
      { id: 5, name: "Editorial Fashion" },
      { id: 6, name: "Engagement Glow" }
    ],
    services: [
      { id: 1003, specialization: "Destination Bridal Package", duration: "4 hrs", timeRange: "Full Day", priceRange: "₹35,000" },
      { id: 1004, specialization: "Soft Glam Engagement", duration: "2 hrs", timeRange: "9 AM - 6 PM", priceRange: "₹18,000" }
    ],
    portfolio: [
      {
        id: 2002,
        beforeImageUrl: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&auto=format&fit=crop&q=80",
        afterImageUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80",
        tag: "Delhi Royal Engagement",
        description: "Ultra-HD Dewy finish for Delhi engagement ceremony."
      }
    ]
  },
  {
    id: 103,
    name: "Sneha Malhotra Artistry",
    email: "sneha.malhotra@makeupglam.in",
    phone: "9820001003",
    isVerified: true,
    trendingRank: 3,
    profile: {
      id: 103,
      artistId: 103,
      profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
      gender: "Female",
      bio: "Pune's leading bridal glow specialist. Over 7 years crafting personalized bridal looks for Maharashtrian & North Indian weddings.",
      location: "Pune",
      experience: "7",
      parlourName: "Sneha's Luxe Beauty Lounge",
      parlourAddress: "Koregaon Park, Pune",
      rating: 4.9,
      reviewCount: 310
    },
    specializations: [
      { id: 7, name: "Nauvari Traditional" },
      { id: 8, name: "3D Airbrush Makeup" },
      { id: 9, name: "Minimalist Sangeet" }
    ],
    services: [
      { id: 1005, specialization: "Maharashtrian Bridal Glam", duration: "3 hrs", timeRange: "6 AM - 2 PM", priceRange: "₹22,000" },
      { id: 1006, specialization: "3D Airbrush Reception", duration: "2.5 hrs", timeRange: "2 PM - 10 PM", priceRange: "₹16,500" }
    ],
    portfolio: [
      {
        id: 2003,
        beforeImageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&auto=format&fit=crop&q=80",
        afterImageUrl: "https://images.unsplash.com/photo-1503104834685-7205e8607eb9?w=600&auto=format&fit=crop&q=80",
        tag: "Pune Bridal Transformation",
        description: "Classic Maharashtrian Traditional Bridal look."
      }
    ]
  },
  {
    id: 104,
    name: "Deepa Nair Beauty Lounge",
    email: "deepa.nair@makeupglam.in",
    phone: "9820001004",
    isVerified: true,
    trendingRank: 4,
    profile: {
      id: 104,
      artistId: 104,
      profileImage: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80",
      gender: "Female",
      bio: "Award-winning makeup artist in Bangalore. Specializing in South Indian temple jewelry bridal styles & glass skin makeovers.",
      location: "Bangalore",
      experience: "9",
      parlourName: "Deepa Nair Glamour Suite",
      parlourAddress: "Indiranagar 100ft Road, Bangalore",
      rating: 4.8,
      reviewCount: 265
    },
    specializations: [
      { id: 10, name: "South Indian Kanjeevaram Bridal" },
      { id: 11, name: "Glass Skin HD" },
      { id: 12, name: "Cocktail Evening Glam" }
    ],
    services: [
      { id: 1007, specialization: "Traditional Muhurtham Look", duration: "3 hrs", timeRange: "5 AM - 1 PM", priceRange: "₹24,000" }
    ],
    portfolio: [
      {
        id: 2004,
        beforeImageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80",
        afterImageUrl: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&auto=format&fit=crop&q=80",
        tag: "Bangalore South Indian Glam",
        description: "Silk saree Kanjeevaram bridal makeup finish."
      }
    ]
  },
  {
    id: 105,
    name: "Meera Rathore Royal Beauty",
    email: "meera.rathore@makeupglam.in",
    phone: "9820001005",
    isVerified: true,
    trendingRank: 5,
    profile: {
      id: 105,
      artistId: 105,
      profileImage: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=500&auto=format&fit=crop&q=80",
      gender: "Female",
      bio: "Jaipur-based royal heritage makeup specialist. Expert in Rajasthani Rajwadi bridal transformations and palace wedding looks.",
      location: "Jaipur",
      experience: "8",
      parlourName: "Meera Rathore Heritage Salon",
      parlourAddress: "C-Scheme, Jaipur, Rajasthan",
      rating: 4.9,
      reviewCount: 198
    },
    specializations: [
      { id: 13, name: "Rajwadi Heritage Bridal" },
      { id: 14, name: "Kundan Jewelry Styling" },
      { id: 15, name: "Royal Sangeet Look" }
    ],
    services: [
      { id: 1008, specialization: "Royal Rajasthani Bridal", duration: "4 hrs", timeRange: "7 AM - 3 PM", priceRange: "₹28,000" }
    ],
    portfolio: [
      {
        id: 2005,
        beforeImageUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&auto=format&fit=crop&q=80",
        afterImageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80",
        tag: "Jaipur Royal Rajwadi",
        description: "Traditional Rajasthani Bride makeover with Kundan jewels."
      }
    ]
  }
];

export default PRECALCULATED_TRENDING_ARTISTS;

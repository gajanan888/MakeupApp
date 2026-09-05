import bcrypt from "bcrypt";
import sequelize from "../src/config/db.js";
import Customer from "../src/models/Customer.js";
import Artist from "../src/models/Artist.js";
import ArtistProfile from "../src/models/ArtistProfile.js";
import ArtistSpecialization from "../src/models/ArtistSpecialization.js";
import ArtistService from "../src/models/ArtistService.js";
import ArtistPortfolio from "../src/models/ArtistPortfolio.js";
import ArtistCertificate from "../src/models/ArtistCertificate.js";
import ArtistPayment from "../src/models/ArtistPayment.js";
import Booking from "../src/models/Booking.js";
import Review from "../src/models/Review.js";
import Wishlist from "../src/models/Wishlist.js";
import { encryptSensitiveValue } from "../src/utils/paymentEncryption.js";

const DEFAULT_PASSWORD = "Test@1234";
const PUNE_TEST_TAG = "[PUNE_TEST_DATA]";

// High resolution face URLs for profiles
const profileImages = {
  artist1: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80",
  artist2: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
  artist3: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80",
  artist4: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80",
  artist5: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=500&auto=format&fit=crop&q=80",
  artist6: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&auto=format&fit=crop&q=80",
  artist7: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=500&auto=format&fit=crop&q=80",
  artist8: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&auto=format&fit=crop&q=80",
  artist9: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80",
  artist10: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=500&auto=format&fit=crop&q=80",
  customer1: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=80",
  customer2: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=80",
};

// Portfolio images
const portfolioBeforeAfter = [
  {
    before: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80",
    after: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&auto=format&fit=crop&q=80",
    tag: "Traditional Maharashtrian Bridal",
    description: "Classic Nauvari look with subtle gold tones and radiant natural skin glow."
  },
  {
    before: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&auto=format&fit=crop&q=80",
    after: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80",
    tag: "Airbrush Reception Glam",
    description: "High-definition airbrush base with defined smokey eyes for evening reception."
  },
  {
    before: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&auto=format&fit=crop&q=80",
    after: "https://images.unsplash.com/photo-1503104834685-7205e8607eb9?w=600&auto=format&fit=crop&q=80",
    tag: "Minimal Dewy Glass Skin",
    description: "Ultra-hydrating dewy finish suitable for day engagement and outdoor shoots."
  }
];

// 2 Customers from Pune
const puneCustomers = [
  {
    name: "Isha Joshi",
    email: "pune_test_cust1_isha@glamai.in",
    phone: "9823900001",
    profileImage: profileImages.customer1,
    role: "user"
  },
  {
    name: "Aditya Deshmukh",
    email: "pune_test_cust2_aditya@glamai.in",
    phone: "9823900002",
    profileImage: profileImages.customer2,
    role: "user"
  }
];

// 10 Artists from Pune only
const puneArtists = [
  {
    name: "Swati Deshpande Makeovers",
    email: "pune_test_artist1_swati@glamai.in",
    phone: "9823000001",
    profile: {
      profileImage: profileImages.artist1,
      gender: "Female",
      bio: "Premier Pune bridal & Maharashtrian traditional makeup specialist based in Kothrud. Known for flawless Nauvari saree draping, HD airbrush finish, and classic regal Maharashtrian bridal glow.",
      location: "Pune",
      experience: "8",
      parlourName: "Swati Deshpande Artistry",
      parlourAddress: "Shop 4, Karve Road, Kothrud, Pune - 411038",
      languages: ["Marathi", "Hindi", "English"],
      homeService: "Available",
      travelToClient: true,
      travelArea: "Pune & PCMC",
      travelChargesType: "Fixed",
      travelChargeAmount: 500,
      brandsUsed: ["MAC", "Huda Beauty", "Bobbi Brown", "Kryolan"],
      rating: 4.9,
      reviewCount: 42,
    },
    specializations: ["Maharashtrian Bridal", "HD Makeup", "Airbrush", "Nauvari Saree Draping"],
    services: [
      { specialization: "Bridal HD & Nauvari Styling", duration: "3.5 hrs", timeRange: "6 AM - 12 PM", priceRange: "₹14,999" },
      { specialization: "Airbrush Glam", duration: "2 hrs", timeRange: "10 AM - 6 PM", priceRange: "₹8,999" },
      { specialization: "Sangeet & Engagement Makeup", duration: "2 hrs", timeRange: "12 PM - 8 PM", priceRange: "₹5,999" }
    ],
    certificate: {
      fileName: "swati_deshpande_pune_cert.pdf",
      fileUrl: "https://res.cloudinary.com/djonmzyiu/image/upload/v1782465082/gvvmptwr4nw5cmrgdjbu.pdf",
      fileSize: 42000,
      fileType: "application/pdf",
      certificateNumber: "PUN-2019-881",
      instituteName: "Pune School of Hair & Makeup"
    },
    payment: {
      accountHolder: "Swati Deshpande",
      bankName: "HDFC Bank",
      accountNumber: "50100982300001",
      ifscCode: "HDFC0000123",
      upiId: "swatideshpande@okhdfc"
    }
  },
  {
    name: "Ananya Kulkarni Glam Studio",
    email: "pune_test_artist2_ananya@glamai.in",
    phone: "9823000002",
    profile: {
      profileImage: profileImages.artist2,
      gender: "Female",
      bio: "Luxury celebrity makeup artist based in Koregaon Park, Pune. Certified by International Beauty Academy. Expert in high-fashion editorial, dewy glass skin, and red carpet looks.",
      location: "Pune",
      experience: "6",
      parlourName: "Ananya Kulkarni Studio Koregaon Park",
      parlourAddress: "Lane 6, Koregaon Park, Pune - 411001",
      languages: ["English", "Hindi", "Marathi"],
      homeService: "Available",
      travelToClient: true,
      travelArea: "Pune Central & East",
      travelChargesType: "Fixed",
      travelChargeAmount: 700,
      brandsUsed: ["Charlotte Tilbury", "NARS", "Estee Lauder", "Fenty Beauty"],
      rating: 4.8,
      reviewCount: 38,
    },
    specializations: ["Glass Skin", "Editorial", "Engagement", "Cocktail Party"],
    services: [
      { specialization: "Dewy Glass Skin Bridal", duration: "3 hrs", timeRange: "8 AM - 2 PM", priceRange: "₹16,500" },
      { specialization: "Glam Cocktail Look", duration: "2 hrs", timeRange: "4 PM - 10 PM", priceRange: "₹7,500" },
      { specialization: "Pre-Wedding Photoshoot Look", duration: "2.5 hrs", timeRange: "7 AM - 3 PM", priceRange: "₹9,000" }
    ],
    certificate: {
      fileName: "ananya_kulkarni_cert.pdf",
      fileUrl: "https://res.cloudinary.com/djonmzyiu/image/upload/v1782465082/gvvmptwr4nw5cmrgdjbu.pdf",
      fileSize: 48000,
      fileType: "application/pdf",
      certificateNumber: "PUN-2021-342",
      instituteName: "International Beauty Academy Pune"
    },
    payment: {
      accountHolder: "Ananya Kulkarni",
      bankName: "ICICI Bank",
      accountNumber: "00040198230002",
      ifscCode: "ICIC0000004",
      upiId: "ananya.kulkarni@okicici"
    }
  },
  {
    name: "Radhika Joshi Bridal Artistry",
    email: "pune_test_artist3_radhika@glamai.in",
    phone: "9823000003",
    profile: {
      profileImage: profileImages.artist3,
      gender: "Female",
      bio: "Baner's top-rated destination bridal artist. Specializes in long-lasting waterproof airbrush makeup and intricate floral hair styling for South & West Indian weddings.",
      location: "Pune",
      experience: "10",
      parlourName: "Radhika's Bridal Salon Baner",
      parlourAddress: "Baner High Street, Baner, Pune - 411045",
      languages: ["Marathi", "Hindi", "English"],
      homeService: "Available",
      travelToClient: true,
      travelArea: "All Maharashtra",
      travelChargesType: "Variable",
      travelChargeAmount: 1000,
      brandsUsed: ["MAC", "Too Faced", "Anastasia Beverly Hills", "Huda Beauty"],
      rating: 5.0,
      reviewCount: 64,
    },
    specializations: ["Destination Bridal", "Airbrush", "Floral Hair Styling", "Reception Glam"],
    services: [
      { specialization: "Royal Airbrush Bridal Package", duration: "4 hrs", timeRange: "5 AM - 11 AM", priceRange: "₹18,000" },
      { specialization: "Reception & Night Glam", duration: "2 hrs", timeRange: "5 PM - 10 PM", priceRange: "₹8,500" },
      { specialization: "Haldi & Mehendi Soft Glow", duration: "1.5 hrs", timeRange: "9 AM - 4 PM", priceRange: "₹6,000" }
    ],
    certificate: {
      fileName: "radhika_joshi_cert.pdf",
      fileUrl: "https://res.cloudinary.com/djonmzyiu/image/upload/v1782465082/gvvmptwr4nw5cmrgdjbu.pdf",
      fileSize: 51000,
      fileType: "application/pdf",
      certificateNumber: "PUN-2017-109",
      instituteName: "L'Oreal Professional Institute Pune"
    },
    payment: {
      accountHolder: "Radhika Joshi",
      bankName: "Axis Bank",
      accountNumber: "915010098230003",
      ifscCode: "UTIB0000010",
      upiId: "radhika.joshi@okaxis"
    }
  },
  {
    name: "Rohan Shinde Hair & Beauty Lounge",
    email: "pune_test_artist4_rohan@glamai.in",
    phone: "9823000004",
    profile: {
      profileImage: profileImages.artist4,
      gender: "Male",
      bio: "Celebrity hairstylist and makeup artist in Viman Nagar, Pune. Master of sculpted cheekbones, bold eye makeup, and modern hair couture for brides and models.",
      location: "Pune",
      experience: "7",
      parlourName: "Rohan Shinde Hair & Glam Viman Nagar",
      parlourAddress: "Phoenix Road, Viman Nagar, Pune - 411014",
      languages: ["English", "Hindi", "Marathi"],
      homeService: "Available",
      travelToClient: true,
      travelArea: "Pune East & Airport area",
      travelChargesType: "Fixed",
      travelChargeAmount: 600,
      brandsUsed: ["Makeup Forever", "NARS", "Dyson Pro", "MAC"],
      rating: 4.7,
      reviewCount: 29,
    },
    specializations: ["Celebrity Styling", "Hair Couture", "Smokey Eye", "HD Party Makeup"],
    services: [
      { specialization: "Celebrity Party Transformation", duration: "2 hrs", timeRange: "11 AM - 9 PM", priceRange: "₹7,000" },
      { specialization: "Modern Bridal Makeover", duration: "3 hrs", timeRange: "7 AM - 1 PM", priceRange: "₹15,000" }
    ],
    certificate: {
      fileName: "rohan_shinde_cert.pdf",
      fileUrl: "https://res.cloudinary.com/djonmzyiu/image/upload/v1782465082/gvvmptwr4nw5cmrgdjbu.pdf",
      fileSize: 44000,
      fileType: "application/pdf",
      certificateNumber: "PUN-2020-554",
      instituteName: "BBLUNT Masterclass Academy Pune"
    },
    payment: {
      accountHolder: "Rohan Shinde",
      bankName: "State Bank of India",
      accountNumber: "300982300004",
      ifscCode: "SBIN0000300",
      upiId: "rohanshinde@oksbi"
    }
  },
  {
    name: "Neha Kadam Beauty Studio",
    email: "pune_test_artist5_neha@glamai.in",
    phone: "9823000005",
    profile: {
      profileImage: profileImages.artist5,
      gender: "Female",
      bio: "Wakad-based minimalist makeup practitioner. Focuses on soft enhancement, skin-first makeup, and light natural glow for contemporary brides.",
      location: "Pune",
      experience: "5",
      parlourName: "Neha Kadam Beauty Studio Wakad",
      parlourAddress: "Dutta Mandir Road, Wakad, Pune - 411057",
      languages: ["Marathi", "Hindi"],
      homeService: "Available",
      travelToClient: true,
      travelArea: "Wakad, Hinjawadi & Baner",
      travelChargesType: "Fixed",
      travelChargeAmount: 400,
      brandsUsed: ["Rare Beauty", "Benefit Cosmetics", "MAC", "Kryolan"],
      rating: 4.8,
      reviewCount: 31,
    },
    specializations: ["Minimalist Makeup", "Nude Bridal", "Soft Glam", "Skin Finish"],
    services: [
      { specialization: "Minimalist Nude Bridal", duration: "2.5 hrs", timeRange: "8 AM - 2 PM", priceRange: "₹11,000" },
      { specialization: "Soft Day Party Glow", duration: "1.5 hrs", timeRange: "10 AM - 6 PM", priceRange: "₹4,500" }
    ],
    certificate: {
      fileName: "neha_kadam_cert.pdf",
      fileUrl: "https://res.cloudinary.com/djonmzyiu/image/upload/v1782465082/gvvmptwr4nw5cmrgdjbu.pdf",
      fileSize: 39000,
      fileType: "application/pdf",
      certificateNumber: "PUN-2022-112",
      instituteName: "VLCC Institute Pune"
    },
    payment: {
      accountHolder: "Neha Kadam",
      bankName: "Kotak Mahindra Bank",
      accountNumber: "6011982300005",
      ifscCode: "KKBK0000951",
      upiId: "nehakadam@okkotak"
    }
  },
  {
    name: "Pooja More Luxury Studio",
    email: "pune_test_artist6_pooja@glamai.in",
    phone: "9823000006",
    profile: {
      profileImage: profileImages.artist6,
      gender: "Female",
      bio: "Camp, Pune veteran artist with 12+ years of experience. Renowned for royal Peshwai bridal makeover, traditional Gajra hair design, and flawless matte foundation.",
      location: "Pune",
      experience: "12",
      parlourName: "Pooja More Makeup Lounge Camp",
      parlourAddress: "MG Road, Camp, Pune - 411001",
      languages: ["Marathi", "Hindi", "English"],
      homeService: "Available",
      travelToClient: true,
      travelArea: "Entire Pune Metropolitan",
      travelChargesType: "Fixed",
      travelChargeAmount: 800,
      brandsUsed: ["MAC", "Huda Beauty", "Estee Lauder", "Bobbi Brown"],
      rating: 4.9,
      reviewCount: 85,
    },
    specializations: ["Peshwai Bridal", "Traditional Gajra", "Matte HD", "Saree Draping"],
    services: [
      { specialization: "Royal Peshwai Bridal Makeover", duration: "3.5 hrs", timeRange: "5 AM - 11 AM", priceRange: "₹16,000" },
      { specialization: "Traditional Marathi Sangeet Look", duration: "2 hrs", timeRange: "12 PM - 7 PM", priceRange: "₹6,500" }
    ],
    certificate: {
      fileName: "pooja_more_cert.pdf",
      fileUrl: "https://res.cloudinary.com/djonmzyiu/image/upload/v1782465082/gvvmptwr4nw5cmrgdjbu.pdf",
      fileSize: 55000,
      fileType: "application/pdf",
      certificateNumber: "PUN-2014-009",
      instituteName: "Peshwa Guild of Artistry Pune"
    },
    payment: {
      accountHolder: "Pooja More",
      bankName: "HDFC Bank",
      accountNumber: "50100982300006",
      ifscCode: "HDFC0000060",
      upiId: "pooja.more@okhdfc"
    }
  },
  {
    name: "Tanvi Gadgil Beauty Bar",
    email: "pune_test_artist7_tanvi@glamai.in",
    phone: "9823000007",
    profile: {
      profileImage: profileImages.artist7,
      gender: "Female",
      bio: "Kalyani Nagar aesthetician and makeup artist. Expert in matte airbrush finish, pastel monsoon makeup, and high-contrast eye makeup.",
      location: "Pune",
      experience: "9",
      parlourName: "Tanvi Gadgil Beauty Bar Kalyani Nagar",
      parlourAddress: "North Main Road, Kalyani Nagar, Pune - 411006",
      languages: ["English", "Hindi", "Marathi"],
      homeService: "Available",
      travelToClient: true,
      travelArea: "Kalyani Nagar & Koregaon Park",
      travelChargesType: "Fixed",
      travelChargeAmount: 500,
      brandsUsed: ["NARS", "Kryolan", "Urban Decay", "MAC"],
      rating: 4.8,
      reviewCount: 47,
    },
    specializations: ["Airbrush Matte", "Monsoon Waterproof", "Pastel Glam", "Eye Artistry"],
    services: [
      { specialization: "Waterproof Airbrush Bridal", duration: "3 hrs", timeRange: "7 AM - 1 PM", priceRange: "₹17,500" },
      { specialization: "Pastel Day Glam", duration: "1.5 hrs", timeRange: "11 AM - 5 PM", priceRange: "₹6,000" }
    ],
    certificate: {
      fileName: "tanvi_gadgil_cert.pdf",
      fileUrl: "https://res.cloudinary.com/djonmzyiu/image/upload/v1782465082/gvvmptwr4nw5cmrgdjbu.pdf",
      fileSize: 46000,
      fileType: "application/pdf",
      certificateNumber: "PUN-2018-772",
      instituteName: "Lakme Academy Pune"
    },
    payment: {
      accountHolder: "Tanvi Gadgil",
      bankName: "ICICI Bank",
      accountNumber: "00040198230007",
      ifscCode: "ICIC0000004",
      upiId: "tanvi.gadgil@okicici"
    }
  },
  {
    name: "Priyanka Mane Makeovers",
    email: "pune_test_artist8_priyanka@glamai.in",
    phone: "9823000008",
    profile: {
      profileImage: profileImages.artist8,
      gender: "Female",
      bio: "Aundh-based artist specialized in pre-wedding shoots, engagement ceremonies, and bridal trial makeup. Trained at L'Oreal Paris Academy.",
      location: "Pune",
      experience: "4",
      parlourName: "Priyanka Mane Makeovers Aundh",
      parlourAddress: "ITI Road, Aundh, Pune - 411007",
      languages: ["Marathi", "Hindi", "English"],
      homeService: "Available",
      travelToClient: true,
      travelArea: "Aundh, Baner, Pashan",
      travelChargesType: "Fixed",
      travelChargeAmount: 450,
      brandsUsed: ["Huda Beauty", "MAC", "Pac Cosmetics", "Maybelline"],
      rating: 4.6,
      reviewCount: 22,
    },
    specializations: ["Engagement Look", "Photoshoot Makeup", "Bridal Trials", "HD Makeup"],
    services: [
      { specialization: "Engagement HD Glam", duration: "2 hrs", timeRange: "9 AM - 6 PM", priceRange: "₹6,999" },
      { specialization: "Outdoor Shoot Makeup", duration: "2 hrs", timeRange: "6 AM - 2 PM", priceRange: "₹5,500" }
    ],
    certificate: {
      fileName: "priyanka_mane_cert.pdf",
      fileUrl: "https://res.cloudinary.com/djonmzyiu/image/upload/v1782465082/gvvmptwr4nw5cmrgdjbu.pdf",
      fileSize: 37000,
      fileType: "application/pdf",
      certificateNumber: "PUN-2023-019",
      instituteName: "L'Oreal Paris Academy Pune"
    },
    payment: {
      accountHolder: "Priyanka Mane",
      bankName: "Bank of Maharashtra",
      accountNumber: "600982300008",
      ifscCode: "MAHG0000001",
      upiId: "priyankamane@mahb"
    }
  },
  {
    name: "Siddharth Ranade Hair & Glam",
    email: "pune_test_artist9_siddharth@glamai.in",
    phone: "9823000009",
    profile: {
      profileImage: profileImages.artist9,
      gender: "Male",
      bio: "Shivaji Nagar creative Director and senior stylist. Specializing in avant-garde fashion makeup, hair extensions, and grooms & brides styling.",
      location: "Pune",
      experience: "11",
      parlourName: "Siddharth Ranade Studio Shivaji Nagar",
      parlourAddress: "JM Road, Shivaji Nagar, Pune - 411005",
      languages: ["English", "Hindi", "Marathi"],
      homeService: "Available",
      travelToClient: true,
      travelArea: "Pune Central",
      travelChargesType: "Fixed",
      travelChargeAmount: 900,
      brandsUsed: ["Charlotte Tilbury", "Tom Ford", "MAC", "Schwarzkopf"],
      rating: 4.9,
      reviewCount: 73,
    },
    specializations: ["Avant-Garde", "Fashion Runway", "Groom & Bride", "Hair Extensions"],
    services: [
      { specialization: "Premium Groom & Bride Combo", duration: "4 hrs", timeRange: "6 AM - 12 PM", priceRange: "₹22,000" },
      { specialization: "Runway High Glam", duration: "2 hrs", timeRange: "2 PM - 9 PM", priceRange: "₹8,000" }
    ],
    certificate: {
      fileName: "siddharth_ranade_cert.pdf",
      fileUrl: "https://res.cloudinary.com/djonmzyiu/image/upload/v1782465082/gvvmptwr4nw5cmrgdjbu.pdf",
      fileSize: 53000,
      fileType: "application/pdf",
      certificateNumber: "PUN-2016-901",
      instituteName: "London School of Beauty Pune Chapter"
    },
    payment: {
      accountHolder: "Siddharth Ranade",
      bankName: "HDFC Bank",
      accountNumber: "50100982300009",
      ifscCode: "HDFC0000060",
      upiId: "siddharth.ranade@okhdfc"
    }
  },
  {
    name: "Sneha Phadke Bridal Studio",
    email: "pune_test_artist10_sneha@glamai.in",
    phone: "9823000010",
    profile: {
      profileImage: profileImages.artist10,
      gender: "Female",
      bio: "FC Road Pune bridal boutique owner. 8+ years crafting customized Maharashtrian, North Indian, and Indo-Western fusion bridal transformations.",
      location: "Pune",
      experience: "8",
      parlourName: "Sneha Phadke Bridal FC Road",
      parlourAddress: "FC Road, Shivajinagar, Pune - 411004",
      languages: ["Marathi", "Hindi", "English"],
      homeService: "Available",
      travelToClient: true,
      travelArea: "Pune City & Suburbs",
      travelChargesType: "Fixed",
      travelChargeAmount: 600,
      brandsUsed: ["Huda Beauty", "MAC", "Estee Lauder", "Inglot"],
      rating: 4.8,
      reviewCount: 54,
    },
    specializations: ["Fusion Bridal", "Maharashtrian Traditional", "HD Airbrush", "Dupatta Draping"],
    services: [
      { specialization: "Grand Fusion Bridal Package", duration: "3.5 hrs", timeRange: "6 AM - 1 PM", priceRange: "₹15,500" },
      { specialization: "Haldi / Mehendi Special", duration: "1.5 hrs", timeRange: "10 AM - 4 PM", priceRange: "₹5,000" }
    ],
    certificate: {
      fileName: "sneha_phadke_cert.pdf",
      fileUrl: "https://res.cloudinary.com/djonmzyiu/image/upload/v1782465082/gvvmptwr4nw5cmrgdjbu.pdf",
      fileSize: 41000,
      fileType: "application/pdf",
      certificateNumber: "PUN-2019-440",
      instituteName: "Jawad Habib Academy Pune"
    },
    payment: {
      accountHolder: "Sneha Phadke",
      bankName: "Axis Bank",
      accountNumber: "915010098230010",
      ifscCode: "UTIB0000010",
      upiId: "snehaphadke@okaxis"
    }
  }
];

export async function seedPuneTestData() {
  try {
    console.log("🌸 [Pune Test Data Seeder] Connecting to database...");
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log("✅ Database authenticated and synchronized (alter: true).");

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    // 1. Seed 2 Pune Customers
    console.log("\n👤 Seeding 2 Pune Customers...");
    const createdCustomers = [];
    for (const custData of puneCustomers) {
      let customer = await Customer.findOne({ where: { email: custData.email }, paranoid: false });
      if (customer) {
        if (customer.deletedAt) {
          await customer.restore();
        }
        await customer.update({
          name: custData.name,
          phone: custData.phone,
          password: hashedPassword,
          role: custData.role,
          profileImage: custData.profileImage
        });
      } else {
        customer = await Customer.create({
          name: custData.name,
          email: custData.email,
          phone: custData.phone,
          password: hashedPassword,
          role: custData.role,
          profileImage: custData.profileImage
        });
      }
      createdCustomers.push(customer);
      console.log(`   Customer created/updated: ${customer.name} (${customer.email}) - ID: ${customer.id}`);
    }

    // 2. Seed 10 Pune Artists
    console.log("\n💄 Seeding 10 Real Artists from Pune only...");
    const createdArtists = [];

    for (let i = 0; i < puneArtists.length; i++) {
      const artData = puneArtists[i];
      let artist = await Artist.findOne({ where: { email: artData.email }, paranoid: false });

      if (artist) {
        if (artist.deletedAt) {
          await artist.restore();
        }
        await artist.update({
          name: artData.name,
          phone: artData.phone,
          artistType: "Salon & Independent",
          businessName: artData.profile.parlourName,
          ownerName: artData.name,
          password: hashedPassword,
          isVerified: true,
          isEmailVerified: true
        });
      } else {
        artist = await Artist.create({
          name: artData.name,
          email: artData.email,
          phone: artData.phone,
          artistType: "Salon & Independent",
          businessName: artData.profile.parlourName,
          ownerName: artData.name,
          password: hashedPassword,
          isVerified: true,
          isEmailVerified: true
        });
      }

      createdArtists.push(artist);

      // Artist Profile
      const existingProfile = await ArtistProfile.findOne({ where: { artistId: artist.id }, paranoid: false });
      if (existingProfile) {
        if (existingProfile.deletedAt) await existingProfile.restore();
        await existingProfile.update({
          artistId: artist.id,
          profileImage: artData.profile.profileImage,
          gender: artData.profile.gender,
          bio: artData.profile.bio,
          location: artData.profile.location,
          experience: artData.profile.experience,
          parlourName: artData.profile.parlourName,
          parlourAddress: artData.profile.parlourAddress,
          languages: artData.profile.languages,
          homeService: artData.profile.homeService,
          travelToClient: artData.profile.travelToClient,
          travelArea: artData.profile.travelArea,
          travelChargesType: artData.profile.travelChargesType,
          travelChargeAmount: artData.profile.travelChargeAmount,
          brandsUsed: artData.profile.brandsUsed,
          rating: artData.profile.rating,
          reviewCount: artData.profile.reviewCount
        });
      } else {
        await ArtistProfile.create({
          artistId: artist.id,
          profileImage: artData.profile.profileImage,
          gender: artData.profile.gender,
          bio: artData.profile.bio,
          location: artData.profile.location,
          experience: artData.profile.experience,
          parlourName: artData.profile.parlourName,
          parlourAddress: artData.profile.parlourAddress,
          languages: artData.profile.languages,
          homeService: artData.profile.homeService,
          travelToClient: artData.profile.travelToClient,
          travelArea: artData.profile.travelArea,
          travelChargesType: artData.profile.travelChargesType,
          travelChargeAmount: artData.profile.travelChargeAmount,
          brandsUsed: artData.profile.brandsUsed,
          rating: artData.profile.rating,
          reviewCount: artData.profile.reviewCount
        });
      }

      // Specializations
      await ArtistSpecialization.destroy({ where: { artistId: artist.id }, force: true });
      for (const specName of artData.specializations) {
        await ArtistSpecialization.create({
          artistId: artist.id,
          name: specName
        });
      }

      // Services
      await ArtistService.destroy({ where: { artistId: artist.id }, force: true });
      for (const srv of artData.services) {
        await ArtistService.create({
          artistId: artist.id,
          specialization: srv.specialization,
          duration: srv.duration,
          timeRange: srv.timeRange,
          priceRange: srv.priceRange
        });
      }

      // Portfolio photos
      await ArtistPortfolio.destroy({ where: { artistId: artist.id }, force: true });
      const portfolioSample = portfolioBeforeAfter[i % portfolioBeforeAfter.length];
      await ArtistPortfolio.create({
        artistId: artist.id,
        beforeImageUrl: portfolioSample.before,
        afterImageUrl: portfolioSample.after,
        tag: portfolioSample.tag,
        description: portfolioSample.description,
        images: [portfolioSample.before, portfolioSample.after]
      });

      // Certificate
      const existingCert = await ArtistCertificate.findOne({ where: { artistId: artist.id }, paranoid: false });
      if (existingCert) {
        if (existingCert.deletedAt) await existingCert.restore();
        await existingCert.update({
          fileName: artData.certificate.fileName,
          fileUrl: artData.certificate.fileUrl,
          fileSize: artData.certificate.fileSize,
          fileType: artData.certificate.fileType,
          certificateNumber: artData.certificate.certificateNumber,
          instituteName: artData.certificate.instituteName
        });
      } else {
        await ArtistCertificate.create({
          artistId: artist.id,
          fileName: artData.certificate.fileName,
          fileUrl: artData.certificate.fileUrl,
          fileSize: artData.certificate.fileSize,
          fileType: artData.certificate.fileType,
          certificateNumber: artData.certificate.certificateNumber,
          instituteName: artData.certificate.instituteName
        });
      }

      // Payment Details
      const encryptedAcc = encryptSensitiveValue(artData.payment.accountNumber);
      const encryptedIfsc = encryptSensitiveValue(artData.payment.ifscCode);
      const existingPay = await ArtistPayment.findOne({ where: { artistId: artist.id }, paranoid: false });
      if (existingPay) {
        if (existingPay.deletedAt) await existingPay.restore();
        await existingPay.update({
          accountHolder: artData.payment.accountHolder,
          bankName: artData.payment.bankName,
          accountNumber: encryptedAcc,
          ifscCode: encryptedIfsc,
          upiId: artData.payment.upiId
        });
      } else {
        await ArtistPayment.create({
          artistId: artist.id,
          accountHolder: artData.payment.accountHolder,
          bankName: artData.payment.bankName,
          accountNumber: encryptedAcc,
          ifscCode: encryptedIfsc,
          upiId: artData.payment.upiId
        });
      }

      console.log(`   Artist created/updated: ${artist.name} (${artist.email}) [Location: Pune] - ID: ${artist.id}`);
    }

    console.log("\n🎉 [SUCCESS] Loaded 10 Pune Artist IDs & 2 Pune Customer IDs into DB.");
    return { createdArtists, createdCustomers };
  } catch (err) {
    console.error("❌ Error seeding Pune test data:", err);
    throw err;
  }
}

if (process.argv[1] && process.argv[1].includes("seed_pune_test_data.js")) {
  seedPuneTestData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

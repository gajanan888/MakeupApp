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
import { encryptSensitiveValue } from "../src/utils/paymentEncryption.js";

const DEFAULT_PASSWORD = "Test@1234";

// Unsplash base photo IDs for authentic faces and makeup photography
const femaleFacePhotoIds = [
  "photo-1494790108377-be9c29b29330",
  "photo-1544005313-94ddf0286df2",
  "photo-1534528741775-53994a69daeb",
  "photo-1517841905240-472988babdf9",
  "photo-1531746020798-e6953c6e8e04",
  "photo-1580489944761-15a19d654956",
  "photo-1531123897727-8f129e1688ce",
  "photo-1508214751196-bcfd4ca60f91",
  "photo-1542838132-92c53300491e",
  "photo-1524504388940-b1c1722653e1",
  "photo-1529626455594-4ff0802cfb7e",
  "photo-1488426862026-3ee34a7d66df",
  "photo-1522337360788-8b13dee7a37e",
  "photo-1512496015851-a90fb38ba796",
  "photo-1596462502278-27bfdc403348",
  "photo-1503104834685-7205e8607eb9",
  "photo-1573496359142-b8d87734a5a2",
  "photo-1567532939604-b6b5b0db2604",
  "photo-1544717305-2782549b5136",
  "photo-1573497019940-1c28c88b4f3e",
  "photo-1534180477871-5d65836b1971",
  "photo-1520813792240-56fc4a3765a7",
  "photo-1509967419530-da38b4704bc6",
  "photo-1514315384763-ba401779410f",
  "photo-1523824921871-d6f1a15151f1",
  "photo-1534308983496-4fabb1a015ee",
  "photo-1513956589380-bad6acb9b9d4",
  "photo-1534528741775-53994a69daeb",
  "photo-1524504388940-b1c1722653e1",
  "photo-1517841905240-472988babdf9"
];

const maleFacePhotoIds = [
  "photo-1539571696357-5a69c17a67c6",
  "photo-1507003211169-0a1dd7228f2d",
  "photo-1500648767791-00dcc994a43e",
  "photo-1506794778202-cad84cf45f1d",
  "photo-1522075469751-3a6694fb2f61",
  "photo-1519085360753-af0119f7cbe7",
  "photo-1501196354995-cbb51c65aaea",
  "photo-1552058544-f2b08422138a",
  "photo-1535713875002-d1d0cf377fde",
  "photo-1570295999919-56ceb5ecca61",
  "photo-1560250097-0b93528c311a",
  "photo-1500648767791-00dcc994a43e",
  "photo-1492562080023-ab3db95bfbce",
  "photo-1506794778202-cad84cf45f1d",
  "photo-1519085360753-af0119f7cbe7"
];

const beforeMakeupPhotoIds = [
  "photo-1522337360788-8b13dee7a37e",
  "photo-1512496015851-a90fb38ba796",
  "photo-1596462502278-27bfdc403348",
  "photo-1517841905240-472988babdf9",
  "photo-1506794778202-cad84cf45f1d",
  "photo-1521119989659-a83eee488004",
  "photo-1548142813-c348350df52b",
  "photo-1508214751196-bcfd4ca60f91",
  "photo-1531746020798-e6953c6e8e04",
  "photo-1542838132-92c53300491e"
];

const afterMakeupPhotoIds = [
  "photo-1488426862026-3ee34a7d66df",
  "photo-1524504388940-b1c1722653e1",
  "photo-1503104834685-7205e8607eb9",
  "photo-1508214751196-bcfd4ca60f91",
  "photo-1542838132-92c53300491e",
  "photo-1519085360753-af0119f7cbe7",
  "photo-1522075469751-3a6694fb2f61",
  "photo-1534528741775-53994a69daeb",
  "photo-1544005313-94ddf0286df2",
  "photo-1494790108377-be9c29b29330"
];

// Helper to generate guaranteed unique image URLs with distinct parameters
let urlCounter = 1;
function getUniqueImageUrl(photoId, width = 500, tag = "img") {
  const url = `https://images.unsplash.com/${photoId}?w=${width}&auto=format&fit=crop&q=80&uid=${tag}_${urlCounter++}`;
  return url;
}

// ── Real Customer Data (20 Distinct Indian Customers) ──────────────────────────
const rawClients = [
  { name: "Aarav Sharma", email: "aarav.sharma@gmail.com", phone: "9876500001", gender: "Male" },
  { name: "Priya Patel", email: "priya.patel@gmail.com", phone: "9876500002", gender: "Female" },
  { name: "Rohan Das", email: "rohan.das@gmail.com", phone: "9876500003", gender: "Male" },
  { name: "Anjali Nair", email: "anjali.nair@gmail.com", phone: "9876500004", gender: "Female" },
  { name: "Vikram Singh", email: "vikram.singh@gmail.com", phone: "9876500005", gender: "Male" },
  { name: "Sneha Reddy", email: "sneha.reddy@gmail.com", phone: "9876500006", gender: "Female" },
  { name: "Kabir Malhotra", email: "kabir.malhotra@gmail.com", phone: "9876500007", gender: "Male" },
  { name: "Meera Joshi", email: "meera.joshi@gmail.com", phone: "9876500008", gender: "Female" },
  { name: "Aditya Verma", email: "aditya.verma@gmail.com", phone: "9876500009", gender: "Male" },
  { name: "Diya Sengupta", email: "diya.sengupta@gmail.com", phone: "9876500010", gender: "Female" },
  { name: "Arjun Mehta", email: "arjun.mehta@gmail.com", phone: "9876500011", gender: "Male" },
  { name: "Neha Kapoor", email: "neha.kapoor@gmail.com", phone: "9876500012", gender: "Female" },
  { name: "Devendra Yadav", email: "devendra.yadav@gmail.com", phone: "9876500013", gender: "Male" },
  { name: "Tanvi Hegde", email: "tanvi.hegde@gmail.com", phone: "9876500014", gender: "Female" },
  { name: "Ishaan Gupta", email: "ishaan.gupta@gmail.com", phone: "9876500015", gender: "Male" },
  { name: "Kavya Kulkarni", email: "kavya.kulkarni@gmail.com", phone: "9876500016", gender: "Female" },
  { name: "Siddharth Rao", email: "siddharth.rao@gmail.com", phone: "9876500017", gender: "Male" },
  { name: "Pooja Deshmukh", email: "pooja.deshmukh@gmail.com", phone: "9876500018", gender: "Female" },
  { name: "Rahul Saxena", email: "rahul.saxena@gmail.com", phone: "9876500019", gender: "Male" },
  { name: "Riya Chatterjee", email: "riya.chatterjee@gmail.com", phone: "9876500020", gender: "Female" },
];

const sampleClients = rawClients.map((client, idx) => {
  const photoId = client.gender === "Male"
    ? maleFacePhotoIds[idx % maleFacePhotoIds.length]
    : femaleFacePhotoIds[idx % femaleFacePhotoIds.length];
  return {
    ...client,
    profileImage: getUniqueImageUrl(photoId, 150, `client_pfp_${idx + 1}`),
  };
});

// ── Base Real Makeup Artists (15 Cities Across India) ─────────────────────────
const sampleArtists = [
  {
    name: "Pooja Sharma Makeovers",
    email: "pooja.mumbai@makeupglam.in",
    phone: "9812345601",
    profile: {
      profileImagePhotoId: "photo-1544005313-94ddf0286df2",
      gender: "Female",
      bio: "Over 10 years of experience styling Bollywood celebrities and high-profile brides in Mumbai. Specializing in luxury bridal and airbrush styling.",
      location: "Mumbai",
      experience: "10",
      parlourName: "Glamour Zone Studio Juhu",
      parlourAddress: "Flat 102, Beach Haven, Juhu, Mumbai - 400049",
      rating: 4.9,
      reviewCount: 124,
    },
    specializations: ["Bridal", "HD Makeup", "Airbrush", "Celebrity"],
    services: [
      { specialization: "Bridal Makeup", duration: "3 hrs", timeRange: "8 AM - 12 PM", priceRange: "₹12,000" },
      { specialization: "HD Makeup", duration: "2 hrs", timeRange: "10 AM - 6 PM", priceRange: "₹7,000" },
    ],
    portfolioTags: ["Marathi Bridal Glow", "Airbrush Royalty", "Glam Cocktail", "Subtle Nude Bride"],
    certificate: {
      fileName: "pooja_sharma_mumbai_cert.pdf",
      fileUrl: "https://res.cloudinary.com/djonmzyiu/image/upload/v1782465082/gvvmptwr4nw5cmrgdjbu.pdf",
      fileSize: 45000,
      fileType: "application/pdf",
      certificateNumber: "MUM-2021-998",
      instituteName: "Mumbai Academy of Celebrity Makeup",
    },
    payment: {
      accountHolder: "Pooja Sharma",
      bankName: "HDFC Bank",
      accountNumber: "50100412345601",
      ifscCode: "HDFC0000060",
      upiId: "pooja.mumbai@okhdfc",
    }
  },
  {
    name: "Rohan Kapoor Glam Studio",
    email: "rohan.delhi@makeupglam.in",
    phone: "9812345602",
    profile: {
      profileImagePhotoId: "photo-1506794778202-cad84cf45f1d",
      gender: "Male",
      bio: "Elite celebrity makeup artist based in Delhi. Known for sophisticated, high-fashion looks and flawless airbrush finishes.",
      location: "Delhi",
      experience: "8",
      parlourName: "Rohan Kapoor Artistry GK2",
      parlourAddress: "M-Block Market, Greater Kailash 2, New Delhi - 110048",
      rating: 4.8,
      reviewCount: 156,
    },
    specializations: ["High Fashion", "Editorial", "Bridal", "Airbrush"],
    services: [
      { specialization: "Editorial Makeup", duration: "2.5 hrs", timeRange: "9 AM - 5 PM", priceRange: "₹10,000" },
      { specialization: "Bridal Airbrush", duration: "3.5 hrs", timeRange: "6 AM - 11 AM", priceRange: "₹18,000" },
    ],
    portfolioTags: ["Vogue Editorial", "Delhi Runway Ramp", "Golden Hour Bridal", "Sharp Sculpted Contour"],
    certificate: {
      fileName: "rohan_kapoor_delhi_cert.pdf",
      fileUrl: "https://res.cloudinary.com/djonmzyiu/image/upload/v1782465082/gvvmptwr4nw5cmrgdjbu.pdf",
      fileSize: 52000,
      fileType: "application/pdf",
      certificateNumber: "DEL-2018-432",
      instituteName: "Pearl Academy Delhi",
    },
    payment: {
      accountHolder: "Rohan Kapoor",
      bankName: "ICICI Bank",
      accountNumber: "00040112345602",
      ifscCode: "ICIC0000004",
      upiId: "rohan.delhi@okicici",
    }
  },
  {
    name: "Deepa Nair Beauty Lounge",
    email: "deepa.blr@makeupglam.in",
    phone: "9812345603",
    profile: {
      profileImagePhotoId: "photo-1531746020798-e6953c6e8e04",
      gender: "Female",
      bio: "Specialist in traditional South Indian bridal transformations. Exquisite silk saree draping and classic temple hairstyles.",
      location: "Bangalore",
      experience: "12",
      parlourName: "Deepa's Bridal Sanctuary",
      parlourAddress: "80 Feet Road, Indiranagar, Bangalore - 560038",
      rating: 4.9,
      reviewCount: 188,
    },
    specializations: ["Bridal", "HD Makeup", "Hairstyling", "Saree Draping"],
    services: [
      { specialization: "South Indian Bridal", duration: "4 hrs", timeRange: "5 AM - 9 AM", priceRange: "₹15,000" },
      { specialization: "HD Party Glow", duration: "1.5 hrs", timeRange: "11 AM - 8 PM", priceRange: "₹5,000" },
    ],
    portfolioTags: ["Kanjeevaram Bride", "Temple Gold Glam", "Classic Jasmine Gajra", "Radiant Silk Finish"],
    certificate: {
      fileName: "deepa_nair_bangalore_cert.pdf",
      fileUrl: "https://res.cloudinary.com/djonmzyiu/image/upload/v1782465082/gvvmptwr4nw5cmrgdjbu.pdf",
      fileSize: 48000,
      fileType: "application/pdf",
      certificateNumber: "BLR-2015-112",
      instituteName: "Bangalore Academy of Hair & Makeup",
    },
    payment: {
      accountHolder: "Deepa Nair",
      bankName: "Axis Bank",
      accountNumber: "915010012345603",
      ifscCode: "UTIB0000010",
      upiId: "deepanair@okaxis",
    }
  },
  {
    name: "Snehal Patil Makeovers",
    email: "snehal.pune@makeupglam.in",
    phone: "9812345604",
    profile: {
      profileImagePhotoId: "photo-1508214751196-bcfd4ca60f91",
      gender: "Female",
      bio: "Passion for minimalist and natural-looking glass skin makeup. Certified professional from international academy in Pune.",
      location: "Pune",
      experience: "6",
      parlourName: "Snehal Patil Artistry FC Road",
      parlourAddress: "F.C. Road, Shivajinagar, Pune - 411005",
      rating: 4.7,
      reviewCount: 94,
    },
    specializations: ["Nude Makeup", "Cocktail Party", "HD Makeup"],
    services: [
      { specialization: "Cocktail Glam", duration: "2 hrs", timeRange: "12 PM - 7 PM", priceRange: "₹6,000" },
      { specialization: "Minimalist Nude Look", duration: "1 hr", timeRange: "9 AM - 6 PM", priceRange: "₹4,000" },
    ],
    portfolioTags: ["Glass Skin Glow", "Dewy Engagement", "Peach Blossom Glam", "Soft Velvet Matte"],
    certificate: {
      fileName: "snehal_patil_pune_cert.pdf",
      fileUrl: "https://res.cloudinary.com/djonmzyiu/image/upload/v1782465082/gvvmptwr4nw5cmrgdjbu.pdf",
      fileSize: 39000,
      fileType: "application/pdf",
      certificateNumber: "PUN-2020-056",
      instituteName: "L'Oreal Professional Institute Pune",
    },
    payment: {
      accountHolder: "Snehal Patil",
      bankName: "State Bank of India",
      accountNumber: "30012345604",
      ifscCode: "SBIN0000300",
      upiId: "snehal.pune@oksbi",
    }
  },
  {
    name: "Sangeetha Krishnan Salon",
    email: "sangeetha.chennai@makeupglam.in",
    phone: "9812345605",
    profile: {
      profileImagePhotoId: "photo-1534528741775-53994a69daeb",
      gender: "Female",
      bio: "Specialized in long-lasting matte makeup suitable for humid weather, particularly classical temple bridal styling in Chennai.",
      location: "Chennai",
      experience: "9",
      parlourName: "Sangeetha's Royal Salon Nungambakkam",
      parlourAddress: "Khader Nawaz Khan Road, Nungambakkam, Chennai - 600006",
      rating: 4.8,
      reviewCount: 115,
    },
    specializations: ["Temple Bridal", "Matte Look", "Hairstyling"],
    services: [
      { specialization: "Temple Bridal Gold", duration: "3.5 hrs", timeRange: "4 AM - 8 AM", priceRange: "₹14,000" },
      { specialization: "Matte Event Makeup", duration: "1.5 hrs", timeRange: "10 AM - 7 PM", priceRange: "₹4,500" },
    ],
    portfolioTags: ["Classical Tamil Bride", "Matte Waterproof Finish", "Royal Temple Gold", "Traditional Andaman Braid"],
    certificate: {
      fileName: "sangeetha_chennai_cert.pdf",
      fileUrl: "https://res.cloudinary.com/djonmzyiu/image/upload/v1782465082/gvvmptwr4nw5cmrgdjbu.pdf",
      fileSize: 42000,
      fileType: "application/pdf",
      certificateNumber: "CHE-2016-789",
      instituteName: "Chennai School of Makeup",
    },
    payment: {
      accountHolder: "Sangeetha Krishnan",
      bankName: "Canara Bank",
      accountNumber: "123410112345605",
      ifscCode: "CNRB0001234",
      upiId: "sangeetha@okcanara",
    }
  },
  {
    name: "Amina Khan Royal Makeovers",
    email: "amina.hyd@makeupglam.in",
    phone: "9812345606",
    profile: {
      profileImagePhotoId: "photo-1542838132-92c53300491e",
      gender: "Female",
      bio: "Expert in royal Nizami and Hyderabadi Muslim bridal looks, specializing in heavy eye makeup and flawless foundation base.",
      location: "Hyderabad",
      experience: "11",
      parlourName: "Amina's Royal Makeovers Jubilee Hills",
      parlourAddress: "Road No. 36, Jubilee Hills, Hyderabad - 500033",
      rating: 4.9,
      reviewCount: 140,
    },
    specializations: ["Nizami Bridal", "Heavy Glam", "Airbrush"],
    services: [
      { specialization: "Nizami Bridal Royale", duration: "4 hrs", timeRange: "7 AM - 12 PM", priceRange: "₹20,000" },
      { specialization: "Heavy Glitter Glam", duration: "2 hrs", timeRange: "3 PM - 9 PM", priceRange: "₹8,000" },
    ],
    portfolioTags: ["Nizami Velvet Cut-Crease", "Smokey Glitter Shimmer", "Pearl Jhumar Bridal", "Hyderabadi Royal Base"],
    certificate: {
      fileName: "amina_khan_hyd_cert.pdf",
      fileUrl: "https://res.cloudinary.com/djonmzyiu/image/upload/v1782465082/gvvmptwr4nw5cmrgdjbu.pdf",
      fileSize: 47000,
      fileType: "application/pdf",
      certificateNumber: "HYD-2014-045",
      instituteName: "Jubilee Beauty Academy Hyderabad",
    },
    payment: {
      accountHolder: "Amina Khan",
      bankName: "Kotak Mahindra Bank",
      accountNumber: "9912345606",
      ifscCode: "KKBK0000001",
      upiId: "amina.hyd@okkotak",
    }
  },
  {
    name: "Debasree Sen Bridal Art",
    email: "debasree.kol@makeupglam.in",
    phone: "9812345607",
    profile: {
      profileImagePhotoId: "photo-1519085360753-af0119f7cbe7",
      gender: "Female",
      bio: "Famous for traditional Bengali bridal looks with intricate Chandan designs, deep kohl eyes, and red Benarasi styling in Kolkata.",
      location: "Kolkata",
      experience: "7",
      parlourName: "Debasree Sen Artistry Gariahat",
      parlourAddress: "Rashbehari Avenue, Gariahat, Kolkata - 700029",
      rating: 4.7,
      reviewCount: 98,
    },
    specializations: ["Traditional Bengali", "Kohl Eyes", "Saree Draping"],
    services: [
      { specialization: "Bengali Bridal Chandan", duration: "3.5 hrs", timeRange: "12 PM - 6 PM", priceRange: "₹12,000" },
      { specialization: "Kohl-Eye Party Look", duration: "1.5 hrs", timeRange: "11 AM - 9 PM", priceRange: "₹4,000" },
    ],
    portfolioTags: ["Chandan Artistry Bride", "Kohl Wings Bengali", "Red Benarasi Glow", "Reception Saree Styling"],
    certificate: {
      fileName: "debasree_sen_kolkata_cert.pdf",
      fileUrl: "https://res.cloudinary.com/djonmzyiu/image/upload/v1782465082/gvvmptwr4nw5cmrgdjbu.pdf",
      fileSize: 51000,
      fileType: "application/pdf",
      certificateNumber: "KOL-2019-123",
      instituteName: "Kolkata Institute of Fine Styling",
    },
    payment: {
      accountHolder: "Debasree Sen",
      bankName: "State Bank of India",
      accountNumber: "098765432107",
      ifscCode: "SBIN0000009",
      upiId: "debasree.kol@oksbi",
    }
  },
  {
    name: "Meera Rathore Royal Beauty",
    email: "meera.jaipur@makeupglam.in",
    phone: "9812345608",
    profile: {
      profileImagePhotoId: "photo-1522075469751-3a6694fb2f61",
      gender: "Female",
      bio: "Specialized in royal Rajasthani and Rajputi poshak styling with heavy traditional bridal makeovers in Jaipur.",
      location: "Jaipur",
      experience: "9",
      parlourName: "Rajputana Queen Studio MI Road",
      parlourAddress: "MI Road, Pink City, Jaipur - 302001",
      rating: 4.8,
      reviewCount: 110,
    },
    specializations: ["Rajputi Bridal", "Smokey Eyes", "Jewelry Styling"],
    services: [
      { specialization: "Rajputi Royal Bridal", duration: "4 hrs", timeRange: "7 AM - 11 AM", priceRange: "₹17,000" },
      { specialization: "Royal Smokey Event", duration: "2 hrs", timeRange: "1 PM - 8 PM", priceRange: "₹6,500" },
    ],
    portfolioTags: ["Rajputi Royal Poshak", "Amber Fort Golden Glow", "Kundan Borla Bride", "Deep Royal Smokey Eye"],
    certificate: {
      fileName: "meera_rathore_jaipur_cert.pdf",
      fileUrl: "https://res.cloudinary.com/djonmzyiu/image/upload/v1782465082/gvvmptwr4nw5cmrgdjbu.pdf",
      fileSize: 44000,
      fileType: "application/pdf",
      certificateNumber: "JAI-2017-889",
      instituteName: "Rajasthan Academy of Salon & Spa",
    },
    payment: {
      accountHolder: "Meera Rathore",
      bankName: "Bank of Baroda",
      accountNumber: "40012345608",
      ifscCode: "BARB0MIROAD",
      upiId: "meera.jaipur@okbaroda",
    }
  },
  {
    name: "Komal Shah Garba Makeovers",
    email: "komal.ahmedabad@makeupglam.in",
    phone: "9812345609",
    profile: {
      profileImagePhotoId: "photo-1507003211169-0a1dd7228f2d",
      gender: "Female",
      bio: "Renowned for vibrant Garba night makeovers and elegant Gujarati Panetar bridal makeovers in Ahmedabad.",
      location: "Ahmedabad",
      experience: "5",
      parlourName: "Komal Shah Beauty Point Navrangpura",
      parlourAddress: "C.G. Road, Navrangpura, Ahmedabad - 380009",
      rating: 4.6,
      reviewCount: 78,
    },
    specializations: ["Gujarati Panetar", "Garba Glam", "HD Base"],
    services: [
      { specialization: "Gujarati Bridal Panetar", duration: "3 hrs", timeRange: "8 AM - 1 PM", priceRange: "₹11,000" },
      { specialization: "Garba Night Glam", duration: "1.5 hrs", timeRange: "5 PM - 10 PM", priceRange: "₹3,500" },
    ],
    portfolioTags: ["Panetar Saree Bride", "Navratri Garba Velvet", "Bright Eye Pop", "Matte Waterproof Base"],
    certificate: {
      fileName: "komal_shah_ahmedabad_cert.pdf",
      fileUrl: "https://res.cloudinary.com/djonmzyiu/image/upload/v1782465082/gvvmptwr4nw5cmrgdjbu.pdf",
      fileSize: 41000,
      fileType: "application/pdf",
      certificateNumber: "AHM-2021-301",
      instituteName: "Ahmedabad Styling School",
    },
    payment: {
      accountHolder: "Komal Shah",
      bankName: "IndusInd Bank",
      accountNumber: "15012345609",
      ifscCode: "INDB0000015",
      upiId: "komal.ahmedabad@okindus",
    }
  },
  {
    name: "Simran Kaur Royal Brides",
    email: "simran.chd@makeupglam.in",
    phone: "9812345610",
    profile: {
      profileImagePhotoId: "photo-1531123897727-8f129e1688ce",
      gender: "Female",
      bio: "Master of Punjabi bridal transformations, heavy passa hairstyles, and vibrant pink blush wedding looks in Chandigarh.",
      location: "Chandigarh",
      experience: "8",
      parlourName: "Simran Kaur Artistry Sector 17",
      parlourAddress: "Sector 17-C, Chandigarh - 160017",
      rating: 4.9,
      reviewCount: 132,
    },
    specializations: ["Punjabi Bridal", "Passa Hairstyling", "Airbrush"],
    services: [
      { specialization: "Punjabi Bridal Royale", duration: "3.5 hrs", timeRange: "6 AM - 11 AM", priceRange: "₹16,000" },
      { specialization: "Sangeet Glam", duration: "2 hrs", timeRange: "2 PM - 8 PM", priceRange: "₹6,000" },
    ],
    portfolioTags: ["Punjabi Phulkari Bride", "Passa Crown Braid", "Sangeet Pink Blush", "High Gloss Lip Glam"],
    certificate: {
      fileName: "simran_kaur_chd_cert.pdf",
      fileUrl: "https://res.cloudinary.com/djonmzyiu/image/upload/v1782465082/gvvmptwr4nw5cmrgdjbu.pdf",
      fileSize: 49000,
      fileType: "application/pdf",
      certificateNumber: "CHD-2018-512",
      instituteName: "VLCC Institute Chandigarh",
    },
    payment: {
      accountHolder: "Simran Kaur",
      bankName: "Punjab National Bank",
      accountNumber: "02340012345610",
      ifscCode: "PUNB0023400",
      upiId: "simran.chd@okpnb",
    }
  },
  {
    name: "Farheen Rizvi Makeovers",
    email: "farheen.lko@makeupglam.in",
    phone: "9812345611",
    profile: {
      profileImagePhotoId: "photo-1544717305-2782549b5136",
      gender: "Female",
      bio: "Specialist in Nawabi bridal looks, heavy kohl eye styling, and traditional Lakhnavi gharara draping in Lucknow.",
      location: "Lucknow",
      experience: "10",
      parlourName: "Farheen's Nawabi Makeovers Hazratganj",
      parlourAddress: "Hazratganj Main Market, Lucknow - 226001",
      rating: 4.8,
      reviewCount: 106,
    },
    specializations: ["Nawabi Bridal", "Kohl Smokey", "Gharara Styling"],
    services: [
      { specialization: "Nawabi Nikah Look", duration: "4 hrs", timeRange: "8 AM - 1 PM", priceRange: "₹18,000" },
      { specialization: "Party Soft Glam", duration: "1.5 hrs", timeRange: "12 PM - 7 PM", priceRange: "₹4,500" },
    ],
    portfolioTags: ["Nawabi Nikah Bride", "Lakhnavi Gharara Glam", "Deep Emerald Smokey", "Classic Velvet Lip"],
    certificate: {
      fileName: "farheen_rizvi_lko_cert.pdf",
      fileUrl: "https://res.cloudinary.com/djonmzyiu/image/upload/v1782465082/gvvmptwr4nw5cmrgdjbu.pdf",
      fileSize: 46000,
      fileType: "application/pdf",
      certificateNumber: "LKO-2016-204",
      instituteName: "Jawad Habib Academy Lucknow",
    },
    payment: {
      accountHolder: "Farheen Rizvi",
      bankName: "Union Bank of India",
      accountNumber: "56010112345611",
      ifscCode: "UBIN0556010",
      upiId: "farheen.lko@okunion",
    }
  },
  {
    name: "Natasha Fernandes Sun & Glow",
    email: "natasha.goa@makeupglam.in",
    phone: "9812345612",
    profile: {
      profileImagePhotoId: "photo-1573496359142-b8d87734a5a2",
      gender: "Female",
      bio: "Destination wedding specialist in Goa. Known for waterproof bronzed glow, beachy waves, and sunset cocktail looks.",
      location: "Goa",
      experience: "7",
      parlourName: "Natasha's Beach Glam Panaji",
      parlourAddress: "MG Road, Panaji, Goa - 403001",
      rating: 4.9,
      reviewCount: 160,
    },
    specializations: ["Destination Beach", "Waterproof Glam", "Beachy Waves"],
    services: [
      { specialization: "Beach Destination Wedding", duration: "3 hrs", timeRange: "1 PM - 6 PM", priceRange: "₹15,000" },
      { specialization: "Sunset Cocktail Glow", duration: "1.5 hrs", timeRange: "3 PM - 8 PM", priceRange: "₹5,500" },
    ],
    portfolioTags: ["Goa Beach Destination Bride", "Bronze Sun-Kissed Skin", "Beachy Sunset Waves", "Coral Nude Glam"],
    certificate: {
      fileName: "natasha_goa_cert.pdf",
      fileUrl: "https://res.cloudinary.com/djonmzyiu/image/upload/v1782465082/gvvmptwr4nw5cmrgdjbu.pdf",
      fileSize: 43000,
      fileType: "application/pdf",
      certificateNumber: "GOA-2019-901",
      instituteName: "Goa International Beauty School",
    },
    payment: {
      accountHolder: "Natasha Fernandes",
      bankName: "HDFC Bank",
      accountNumber: "50100412345612",
      ifscCode: "HDFC0000201",
      upiId: "natasha.goa@okhdfc",
    }
  },
  {
    name: "Anupama Menon Kerala Grace",
    email: "anupama.kochi@makeupglam.in",
    phone: "9812345613",
    profile: {
      profileImagePhotoId: "photo-1567532939604-b6b5b0db2604",
      gender: "Female",
      bio: "Specializing in traditional Kerala Christian and Hindu Kasavu bridal styling, golden accessories, and soft glowing base in Kochi.",
      location: "Kochi",
      experience: "9",
      parlourName: "Anupama's Grace Studio MG Road",
      parlourAddress: "MG Road, Ernakulam, Kochi - 682016",
      rating: 4.8,
      reviewCount: 95,
    },
    specializations: ["Kasavu Bridal", "Christian Gown Makeup", "Jasmine Hair"],
    services: [
      { specialization: "Kerala Kasavu Bridal", duration: "3.5 hrs", timeRange: "5 AM - 9 AM", priceRange: "₹13,000" },
      { specialization: "Christian Gown Glam", duration: "2 hrs", timeRange: "9 AM - 3 PM", priceRange: "₹7,500" },
    ],
    portfolioTags: ["Kerala Kasavu Bride", "Christian White Lace Glow", "Golden Temple Braid", "Natural Dewy Blush"],
    certificate: {
      fileName: "anupama_menon_kochi_cert.pdf",
      fileUrl: "https://res.cloudinary.com/djonmzyiu/image/upload/v1782465082/gvvmptwr4nw5cmrgdjbu.pdf",
      fileSize: 44000,
      fileType: "application/pdf",
      certificateNumber: "KOC-2017-678",
      instituteName: "Kochi Academy of Styling",
    },
    payment: {
      accountHolder: "Anupama Menon",
      bankName: "State Bank of India",
      accountNumber: "30012345613",
      ifscCode: "SBIN0008016",
      upiId: "anupama.kochi@oksbi",
    }
  },
  {
    name: "Bhavna Patel Diamond Studio",
    email: "bhavna.surat@makeupglam.in",
    phone: "9812345614",
    profile: {
      profileImagePhotoId: "photo-1573497019940-1c28c88b4f3e",
      gender: "Female",
      bio: "Surat's leading artist for heavy diamond jewelry styling, royal Gharchola bridal looks, and high-shine glitter makeovers.",
      location: "Surat",
      experience: "11",
      parlourName: "Bhavna's Diamond Studio Ghoddod Road",
      parlourAddress: "Ghoddod Road, Surat - 395007",
      rating: 4.9,
      reviewCount: 142,
    },
    specializations: ["Gharchola Bridal", "Diamond Jewelry Glam", "Glitter Eye"],
    services: [
      { specialization: "Surat Royal Gharchola", duration: "4 hrs", timeRange: "7 AM - 12 PM", priceRange: "₹16,000" },
      { specialization: "High Shine Party Glam", duration: "2 hrs", timeRange: "3 PM - 9 PM", priceRange: "₹6,000" },
    ],
    portfolioTags: ["Gharchola Royal Bride", "Diamond Shimmer Eye", "Surat Glitter Glow", "Rich Red Lip Accent"],
    certificate: {
      fileName: "bhavna_patel_surat_cert.pdf",
      fileUrl: "https://res.cloudinary.com/djonmzyiu/image/upload/v1782465082/gvvmptwr4nw5cmrgdjbu.pdf",
      fileSize: 48000,
      fileType: "application/pdf",
      certificateNumber: "SUR-2015-443",
      instituteName: "Surat Fashion & Makeup Institute",
    },
    payment: {
      accountHolder: "Bhavna Patel",
      bankName: "ICICI Bank",
      accountNumber: "00040112345614",
      ifscCode: "ICIC0000395",
      upiId: "bhavna.surat@okicici",
    }
  },
  {
    name: "Ruchika Sharma Royal Touch",
    email: "ruchika.indore@makeupglam.in",
    phone: "9812345615",
    profile: {
      profileImagePhotoId: "photo-1520813792240-56fc4a3765a7",
      gender: "Female",
      bio: "Premier makeup artist in Indore for Malwa bridal transformations, soft pastel engagement looks, and airbrush HD base.",
      location: "Indore",
      experience: "7",
      parlourName: "Ruchika's Royal Touch Vijay Nagar",
      parlourAddress: "Vijay Nagar Main Road, Indore - 452010",
      rating: 4.7,
      reviewCount: 89,
    },
    specializations: ["Malwa Bridal", "Pastel Engagement", "Airbrush HD"],
    services: [
      { specialization: "Indore Malwa Bridal", duration: "3.5 hrs", timeRange: "8 AM - 1 PM", priceRange: "₹13,000" },
      { specialization: "Pastel Engagement Glam", duration: "2 hrs", timeRange: "11 AM - 6 PM", priceRange: "₹5,000" },
    ],
    portfolioTags: ["Malwa Traditional Bride", "Pastel Pink Engagement", "Airbrush Satin Base", "Soft Winged Liner"],
    certificate: {
      fileName: "ruchika_sharma_indore_cert.pdf",
      fileUrl: "https://res.cloudinary.com/djonmzyiu/image/upload/v1782465082/gvvmptwr4nw5cmrgdjbu.pdf",
      fileSize: 41000,
      fileType: "application/pdf",
      certificateNumber: "IND-2019-332",
      instituteName: "Indore Beauty Academy",
    },
    payment: {
      accountHolder: "Ruchika Sharma",
      bankName: "Axis Bank",
      accountNumber: "915010012345615",
      ifscCode: "UTIB0000452",
      upiId: "ruchika.indore@okaxis",
    }
  }
];

// Additional first and last names for unique local artists per city
const extraFirstNames = [
  "Aashi", "Ishita", "Radhika", "Simran", "Tarun", "Natasha", "Farhan", "Bhavna",
  "Ruchika", "Tanvi", "Sonali", "Payal", "Garima", "Kriti", "Shruti", "Divya",
  "Alok", "Sameer", "Harsh", "Deepak", "Nisha", "Swati", "Rashmi", "Varun"
];

const extraLastNames = [
  "Sharma", "Verma", "Gupta", "Deshmukh", "Chowdhury", "Banerjee", "Sengupta", "Rao",
  "Reddy", "Joshi", "Kulkarni", "Patel", "Shah", "Malhotra", "Kapoor", "Nair"
];

async function seed() {
  try {
    console.log("🚀 Starting database seeding with 100% unique real data...");
    await sequelize.authenticate();
    console.log("✅ Connected to database.");

    // Sync database tables securely
    await sequelize.sync();
    const qi = sequelize.getQueryInterface();
    try { await qi.addColumn("Bookings", "backupArtistId", { type: "INTEGER", allowNull: true }); } catch (e) {}
    try { await qi.addColumn("Bookings", "backupStatus", { type: "VARCHAR(255)", allowNull: false, defaultValue: "pending" }); } catch (e) {}
    try { await qi.addColumn("Bookings", "startOtp", { type: "VARCHAR(255)", allowNull: true }); } catch (e) {}
    console.log("✅ Database tables synchronized");

    const clientHashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    const artistHashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    // 1. Seed Customers (Clients)
    console.log("\n👤 Seeding Clients...");
    let clientsCreated = 0;
    let clientsUpdated = 0;

    for (const cData of sampleClients) {
      const existing = await Customer.findOne({ where: { email: cData.email } });
      if (existing) {
        await existing.update({
          name: cData.name,
          phone: cData.phone,
          password: clientHashedPassword,
          role: "user",
          profileImage: cData.profileImage,
        });
        clientsUpdated++;
      } else {
        await Customer.create({
          name: cData.name,
          email: cData.email,
          phone: cData.phone,
          password: clientHashedPassword,
          role: "user",
          profileImage: cData.profileImage,
        });
        clientsCreated++;
      }
    }
    console.log(`✅ Clients complete: Created ${clientsCreated}, Updated ${clientsUpdated}`);

    // 2. Build 100% Unique Artists (Base + Location-based)
    console.log("\n🎨 Building 100% Unique Artists...");
    const allArtistsToSeed = [];

    // Process base artists with guaranteed unique image URLs and portfolio items
    sampleArtists.forEach((artist, idx) => {
      const artPfp = getUniqueImageUrl(artist.profile.profileImagePhotoId, 150, `base_art_pfp_${idx + 1}`);

      const uniquePortfolio = artist.portfolioTags.map((tag, pIdx) => {
        const bId = beforeMakeupPhotoIds[(idx * 4 + pIdx) % beforeMakeupPhotoIds.length];
        const aId = afterMakeupPhotoIds[(idx * 4 + pIdx) % afterMakeupPhotoIds.length];
        const bUrl = getUniqueImageUrl(bId, 600, `base_${idx}_p_${pIdx}_before`);
        const aUrl = getUniqueImageUrl(aId, 600, `base_${idx}_p_${pIdx}_after`);
        return {
          beforeImageUrl: bUrl,
          afterImageUrl: aUrl,
          tag,
          description: `Signature ${tag} makeover created by ${artist.name} in ${artist.profile.location}.`,
          images: [aUrl, bUrl],
        };
      });

      allArtistsToSeed.push({
        ...artist,
        profile: {
          ...artist.profile,
          profileImage: artPfp,
        },
        portfolio: uniquePortfolio,
      });
    });

    // Generate location artists with unique profile pictures & unique portfolio items
    sampleArtists.forEach((baseArtist, locIdx) => {
      const location = baseArtist.profile.location;
      for (let artIdx = 1; artIdx <= 4; artIdx++) {
        const uniqueArtistIndex = locIdx * 4 + artIdx + 15;
        const nameIndex = (locIdx * 4 + artIdx) % extraFirstNames.length;
        const lastNameIndex = (locIdx * 4 + artIdx) % extraLastNames.length;
        const firstName = extraFirstNames[nameIndex];
        const lastName = extraLastNames[lastNameIndex];
        const gender = (artIdx % 3 === 0) ? "Male" : "Female";
        const photoPool = gender === "Male" ? maleFacePhotoIds : femaleFacePhotoIds;
        const photoId = photoPool[uniqueArtistIndex % photoPool.length];

        const newName = `${firstName} ${lastName} Artistry`;
        const newEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${location.toLowerCase()}@makeupglam.in`;
        const newPhone = `98200${String(locIdx).padStart(2, '0')}${String(artIdx).padStart(3, '0')}`;

        const rating = parseFloat((4.2 + (uniqueArtistIndex % 8) * 0.1).toFixed(1));
        const reviewCount = 25 + uniqueArtistIndex * 3;
        const experience = String(3 + (uniqueArtistIndex % 9));

        const artPfp = getUniqueImageUrl(photoId, 150, `loc_art_pfp_${locIdx}_${artIdx}`);

        const newProfile = {
          profileImage: artPfp,
          gender,
          bio: `Professional makeup artist in ${location} with ${experience} years of experience. Specializing in ${baseArtist.specializations[0]} and customized transformations.`,
          location,
          experience,
          parlourName: `${firstName}'s Glamour Studio`,
          parlourAddress: `Studio #${100 + artIdx}, Main Road, ${location}`,
          rating,
          reviewCount,
        };

        const newServices = baseArtist.services.map((svc, sIdx) => {
          const basePrice = 4000 + (uniqueArtistIndex * 350) + (sIdx * 1500);
          return {
            specialization: svc.specialization,
            duration: svc.duration,
            timeRange: svc.timeRange,
            priceRange: `₹${basePrice.toLocaleString('en-IN')}`,
          };
        });

        const newPortfolioTags = [
          `${location} Bridal Glam`,
          `HD Airbrush ${firstName}`,
          `Cocktail Glow Artistry`,
          `Sangeet Night Shimmer`
        ];

        const newPortfolio = newPortfolioTags.map((tag, pIdx) => {
          const bId = beforeMakeupPhotoIds[(uniqueArtistIndex * 4 + pIdx) % beforeMakeupPhotoIds.length];
          const aId = afterMakeupPhotoIds[(uniqueArtistIndex * 4 + pIdx) % afterMakeupPhotoIds.length];
          const bUrl = getUniqueImageUrl(bId, 600, `loc_${locIdx}_${artIdx}_p_${pIdx}_before`);
          const aUrl = getUniqueImageUrl(aId, 600, `loc_${locIdx}_${artIdx}_p_${pIdx}_after`);
          return {
            beforeImageUrl: bUrl,
            afterImageUrl: aUrl,
            tag,
            description: `Exclusive ${tag} styling by ${firstName} ${lastName} in ${location}.`,
            images: [aUrl, bUrl],
          };
        });

        const cityCode = location.substring(0, 3).toUpperCase();
        const newCertificate = {
          fileName: `${firstName.toLowerCase()}_${cityCode.toLowerCase()}_cert.pdf`,
          fileUrl: "https://res.cloudinary.com/djonmzyiu/image/upload/v1782465082/gvvmptwr4nw5cmrgdjbu.pdf",
          fileSize: 42000 + uniqueArtistIndex * 250,
          fileType: "application/pdf",
          certificateNumber: `${cityCode}-2023-${100 + uniqueArtistIndex}`,
          instituteName: `${location} Professional Makeup Academy`,
        };

        const newPayment = {
          accountHolder: `${firstName} ${lastName}`,
          bankName: baseArtist.payment.bankName,
          accountNumber: `501004123${String(uniqueArtistIndex).padStart(4, '0')}`,
          ifscCode: baseArtist.payment.ifscCode,
          upiId: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@ok${baseArtist.payment.bankName.substring(0, 4).toLowerCase()}`,
        };

        allArtistsToSeed.push({
          name: newName,
          email: newEmail,
          phone: newPhone,
          profile: newProfile,
          specializations: baseArtist.specializations,
          services: newServices,
          portfolio: newPortfolio,
          certificate: newCertificate,
          payment: newPayment,
        });
      }
    });

    console.log(`🎨 Total Artists to Seed: ${allArtistsToSeed.length}`);

    let artistsCreated = 0;
    let artistsUpdated = 0;

    for (const artData of allArtistsToSeed) {
      let artist = await Artist.findOne({ where: { email: artData.email } });

      if (artist) {
        await artist.update({
          name: artData.name,
          phone: artData.phone,
          password: artistHashedPassword,
          isVerified: true
        });
        artistsUpdated++;
      } else {
        artist = await Artist.create({
          name: artData.name,
          email: artData.email,
          phone: artData.phone,
          password: artistHashedPassword,
          isVerified: true
        });
        artistsCreated++;
      }

      // Sync Profile
      const existingProfile = await ArtistProfile.findOne({ where: { artistId: artist.id } });
      if (existingProfile) {
        await existingProfile.update(artData.profile);
      } else {
        await ArtistProfile.create({
          artistId: artist.id,
          ...artData.profile
        });
      }

      // Sync Specializations
      await ArtistSpecialization.destroy({ where: { artistId: artist.id } });
      for (const spec of artData.specializations) {
        await ArtistSpecialization.create({
          artistId: artist.id,
          name: spec
        });
      }

      // Sync Services
      await ArtistService.destroy({ where: { artistId: artist.id } });
      for (const svc of artData.services) {
        await ArtistService.create({
          artistId: artist.id,
          ...svc
        });
      }

      // Sync Portfolio
      await ArtistPortfolio.destroy({ where: { artistId: artist.id } });
      for (const port of artData.portfolio) {
        await ArtistPortfolio.create({
          artistId: artist.id,
          ...port
        });
      }

      // Sync Certificate
      await ArtistCertificate.destroy({ where: { artistId: artist.id } });
      if (artData.certificate) {
        await ArtistCertificate.create({
          artistId: artist.id,
          ...artData.certificate
        });
      }

      // Sync Payment
      const encryptedAccountNumber = encryptSensitiveValue(artData.payment.accountNumber);
      const encryptedIfscCode = encryptSensitiveValue(artData.payment.ifscCode);

      const existingPayment = await ArtistPayment.findOne({ where: { artistId: artist.id } });
      if (existingPayment) {
        await existingPayment.update({
          accountHolder: artData.payment.accountHolder,
          bankName: artData.payment.bankName,
          accountNumber: encryptedAccountNumber,
          ifscCode: encryptedIfscCode,
          upiId: artData.payment.upiId
        });
      } else {
        await ArtistPayment.create({
          artistId: artist.id,
          accountHolder: artData.payment.accountHolder,
          bankName: artData.payment.bankName,
          accountNumber: encryptedAccountNumber,
          ifscCode: encryptedIfscCode,
          upiId: artData.payment.upiId
        });
      }
    }
    console.log(`✅ Artists complete: Created ${artistsCreated}, Synced ${artistsUpdated}`);

    // 3. Seed Bookings
    console.log("\n📅 Seeding Bookings...");
    const allCustomers = await Customer.findAll();
    const allArtists = await Artist.findAll();

    const seededCustomerIds = allCustomers
      .filter(c => c.email.endsWith("@gmail.com"))
      .map(c => c.id);

    await Booking.destroy({
      where: {
        customerId: seededCustomerIds
      }
    });

    const categories = ["Bridal", "Party", "Engagement", "Photoshoot", "Celebrity", "Editorial"];
    let bookingsCreated = 0;

    for (let i = 0; i < Math.min(allArtists.length, 30); i++) {
      const artist = allArtists[i];
      const numBookings = 2 + (i % 4);

      for (let b = 0; b < numBookings; b++) {
        const customer = allCustomers[(i + b) % allCustomers.length];
        const date = new Date(Date.now() - (b + 1) * 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const category = categories[(i + b) % categories.length];

        await Booking.create({
          customerId: customer.id,
          artistId: artist.id,
          date,
          time: "11:00 AM",
          category,
          price: 5000 + (b * 1000),
          status: "completed",
          location: "Studio",
          totalPaid: 5000 + (b * 1000),
          advancePaid: true,
        });
        bookingsCreated++;
      }

      // Add a future pending booking
      const futureCustomer = allCustomers[(i + 5) % allCustomers.length];
      const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      await Booking.create({
        customerId: futureCustomer.id,
        artistId: artist.id,
        date: futureDate,
        time: "02:00 PM",
        category: categories[i % categories.length],
        price: 7500,
        status: "pending",
        location: "Client Place",
        advancePaid: false,
      });
      bookingsCreated++;
    }

    console.log(`✅ Bookings complete: Created ${bookingsCreated} mock bookings.`);
    console.log("\n⭐️ Seeding successfully completed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();

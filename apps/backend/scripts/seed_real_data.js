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

const sampleClients = [
  { name: "Aarav Sharma", email: "aarav.sharma@gmail.com", phone: "9876500001", profileImage: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150" },
  { name: "Priya Patel", email: "priya.patel@gmail.com", phone: "9876500002", profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" },
  { name: "Rohan Das", email: "rohan.das@gmail.com", phone: "9876500003", profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" },
  { name: "Anjali Nair", email: "anjali.nair@gmail.com", phone: "9876500004", profileImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150" },
  { name: "Vikram Singh", email: "vikram.singh@gmail.com", phone: "9876500005", profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150" },
  { name: "Sneha Reddy", email: "sneha.reddy@gmail.com", phone: "9876500006", profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" },
  { name: "Kabir Malhotra", email: "kabir.malhotra@gmail.com", phone: "9876500007", profileImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150" },
  { name: "Meera Joshi", email: "meera.joshi@gmail.com", phone: "9876500008", profileImage: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150" },
  { name: "Aditya Verma", email: "aditya.verma@gmail.com", phone: "9876500009", profileImage: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150" },
  { name: "Diya Sengupta", email: "diya.sengupta@gmail.com", phone: "9876500010", profileImage: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150" },
  { name: "Arjun Mehta", email: "arjun.mehta@gmail.com", phone: "9876500011", profileImage: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150" },
  { name: "Neha Kapoor", email: "neha.kapoor@gmail.com", phone: "9876500012", profileImage: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150" },
  { name: "Devendra Yadav", email: "devendra.yadav@gmail.com", phone: "9876500013", profileImage: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150" },
  { name: "Tanvi Hegde", email: "tanvi.hegde@gmail.com", phone: "9876500014", profileImage: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150" },
  { name: "Ishaan Gupta", email: "ishaan.gupta@gmail.com", phone: "9876500015", profileImage: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=150" },
];

const sampleArtists = [
  {
    name: "Pooja Sharma Makeovers",
    email: "pooja.mumbai@makeupglam.in",
    phone: "9812345601",
    profile: {
      profileImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
      gender: "Female",
      bio: "Over 10 years of experience styling Bollywood celebrities and high-profile brides in Mumbai. Specializing in luxury makeup and airbrush styling.",
      location: "Mumbai",
      experience: "10",
      parlourName: "Glamour Zone Studio",
      parlourAddress: "Flat 102, Beach Haven, Juhu, Mumbai - 400049",
      rating: 4.8,
      reviewCount: 92,
    },
    specializations: ["Bridal", "HD Makeup", "Airbrush", "Fashion"],
    services: [
      { specialization: "Bridal Makeup", duration: "3 hrs", timeRange: "8 AM - 12 PM", priceRange: "₹12,000" },
      { specialization: "HD Makeup", duration: "2 hrs", timeRange: "10 AM - 6 PM", priceRange: "₹7,000" },
    ],
    portfolio: [
      {
        beforeImageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500",
        afterImageUrl: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=500",
        tag: "Bridal Glow",
        description: "Traditional Marathi Bridal makeup with gold accents.",
      }
    ],
    certificate: {
      fileName: "mumbai_makeup_cert.pdf",
      fileUrl: "https://res.cloudinary.com/djonmzyiu/image/upload/v1782465082/gvvmptwr4nw5cmrgdjbu.pdf",
      fileSize: 45000,
      fileType: "application/pdf",
      certificateNumber: "MUM-2021-998",
      instituteName: "Mumbai Makeup Academy",
    },
    payment: {
      accountHolder: "Pooja Sharma",
      bankName: "HDFC Bank",
      accountNumber: "50100412345601",
      ifscCode: "HDFC0000060",
      upiId: "pooja@okhdfc",
    }
  },
  {
    name: "Rohan Kapoor Glam Studio",
    email: "rohan.delhi@makeupglam.in",
    phone: "9812345602",
    profile: {
      profileImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150",
      gender: "Male",
      bio: "Elite celebrity makeup artist based in Delhi. Known for sophisticated, high-fashion looks and airbrush flawless finishes.",
      location: "Delhi",
      experience: "8",
      parlourName: "Rohan Kapoor Artistry",
      parlourAddress: "M-Block Market, Greater Kailash 2, New Delhi - 110048",
      rating: 4.9,
      reviewCount: 156,
    },
    specializations: ["High Fashion", "Editorial", "Bridal", "Airbrush"],
    services: [
      { specialization: "Editorial Makeup", duration: "2.5 hrs", timeRange: "9 AM - 5 PM", priceRange: "₹10,000" },
      { specialization: "Bridal Airbrush", duration: "3.5 hrs", timeRange: "6 AM - 11 AM", priceRange: "₹18,000" },
    ],
    portfolio: [
      {
        beforeImageUrl: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=500",
        afterImageUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500",
        tag: "Fashion Ramp",
        description: "Bold avant-garde look for Delhi Fashion Week.",
      }
    ],
    certificate: {
      fileName: "delhi_fashion_cert.pdf",
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
      upiId: "rohan@okicici",
    }
  },
  {
    name: "Deepa Nair Beauty Lounge",
    email: "deepa.blr@makeupglam.in",
    phone: "9812345603",
    profile: {
      profileImage: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150",
      gender: "Female",
      bio: "Specialist in traditional South Indian bridal transformations. Exquisite saree draping and classic hairstyles.",
      location: "Bangalore",
      experience: "12",
      parlourName: "Deepa's Bridal Sanctuary",
      parlourAddress: "80 Feet Road, Indiranagar, Bangalore - 560038",
      rating: 4.7,
      reviewCount: 88,
    },
    specializations: ["Bridal", "HD Makeup", "Hairstyling", "Saree Draping"],
    services: [
      { specialization: "South Indian Bridal", duration: "4 hrs", timeRange: "5 AM - 9 AM", priceRange: "₹15,000" },
      { specialization: "HD Party Glow", duration: "1.5 hrs", timeRange: "11 AM - 8 PM", priceRange: "₹5,000" },
    ],
    portfolio: [
      {
        beforeImageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500",
        afterImageUrl: "https://images.unsplash.com/photo-1503104834685-7205e8607eb9?w=500",
        tag: "South Bridal",
        description: "Traditional silk saree draping with temple jewelry look.",
      }
    ],
    certificate: {
      fileName: "bangalore_makeup_cert.pdf",
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
      profileImage: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150",
      gender: "Female",
      bio: "Passion for minimalist and natural-looking makeup. Certified professional from international academy.",
      location: "Pune",
      experience: "6",
      parlourName: "Snehal Patil Artistry",
      parlourAddress: "F.C. Road, Shivajinagar, Pune - 411005",
      rating: 4.5,
      reviewCount: 42,
    },
    specializations: ["Nude Makeup", "Cocktail Party", "HD Makeup"],
    services: [
      { specialization: "Cocktail Glam", duration: "2 hrs", timeRange: "12 PM - 7 PM", priceRange: "₹6,000" },
      { specialization: "Minimalist Nude Look", duration: "1 hr", timeRange: "9 AM - 6 PM", priceRange: "₹4,000" },
    ],
    portfolio: [
      {
        beforeImageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500",
        afterImageUrl: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=500",
        tag: "Dewy Skin",
        description: "Glass skin dewy makeup for evening events.",
      }
    ],
    certificate: {
      fileName: "pune_academy_cert.pdf",
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
      upiId: "snehal@oksbi",
    }
  },
  {
    name: "Sangeetha Krishnan Salon",
    email: "sangeetha.chennai@makeupglam.in",
    phone: "9812345605",
    profile: {
      profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      gender: "Female",
      bio: "Specialized in long-lasting matte makeup suitable for humid weather, particularly classical temple bridal styling.",
      location: "Chennai",
      experience: "9",
      parlourName: "Sangeetha's Royal Salon",
      parlourAddress: "Khader Nawaz Khan Road, Nungambakkam, Chennai - 600006",
      rating: 4.6,
      reviewCount: 75,
    },
    specializations: ["Temple Bridal", "Matte Look", "Hairstyling"],
    services: [
      { specialization: "Temple Bridal Gold", duration: "3.5 hrs", timeRange: "4 AM - 8 AM", priceRange: "₹14,000" },
      { specialization: "Matte Event Makeup", duration: "1.5 hrs", timeRange: "10 AM - 7 PM", priceRange: "₹4,500" },
    ],
    portfolio: [
      {
        beforeImageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500",
        afterImageUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=500",
        tag: "Classical Bride",
        description: "Vibrant traditional bridal makeover with heavy jasmine gajra.",
      }
    ],
    certificate: {
      fileName: "chennai_school_cert.pdf",
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
      upiId: "sangeetha@okaxis",
    }
  },
  {
    name: "Amina Khan Royal Makeovers",
    email: "amina.hyd@makeupglam.in",
    phone: "9812345606",
    profile: {
      profileImage: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=150",
      gender: "Female",
      bio: "Expert in royal Nizami and Hyderabadi Muslim bridal look, specializing in heavy eye makeup and flawless foundation base.",
      location: "Hyderabad",
      experience: "11",
      parlourName: "Amina's Royal Makeovers",
      parlourAddress: "Road No. 36, Jubilee Hills, Hyderabad - 500033",
      rating: 4.8,
      reviewCount: 110,
    },
    specializations: ["Nizami Bridal", "Heavy Glam", "Airbrush"],
    services: [
      { specialization: "Nizami Bridal Royale", duration: "4 hrs", timeRange: "7 AM - 12 PM", priceRange: "₹20,000" },
      { specialization: "Heavy Glitter Glam", duration: "2 hrs", timeRange: "3 PM - 9 PM", priceRange: "₹8,000" },
    ],
    portfolio: [
      {
        beforeImageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500",
        afterImageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500",
        tag: "Nizami Bridal",
        description: "Glitter cut-crease eye makeup with flawless airbrush base.",
      }
    ],
    certificate: {
      fileName: "hyd_academy_cert.pdf",
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
      upiId: "amina@okkotak",
    }
  },
  {
    name: "Debasree Sen Bridal Art",
    email: "debasree.kol@makeupglam.in",
    phone: "9812345607",
    profile: {
      profileImage: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150",
      gender: "Female",
      bio: "Famous for traditional Bengali bridal looks with intricate Chandan designs and dramatic kohl eyes.",
      location: "Kolkata",
      experience: "7",
      parlourName: "Debasree Sen Artistry",
      parlourAddress: "Rashbehari Avenue, Gariahat, Kolkata - 700029",
      rating: 4.4,
      reviewCount: 38,
    },
    specializations: ["Traditional Bengali", "Kohl Eyes", "Saree Draping"],
    services: [
      { specialization: "Bengali Bridal Chandan", duration: "3.5 hrs", timeRange: "12 PM - 6 PM", priceRange: "₹12,000" },
      { specialization: "Kohl-Eye Party Look", duration: "1.5 hrs", timeRange: "11 AM - 9 PM", priceRange: "₹4,000" },
    ],
    portfolio: [
      {
        beforeImageUrl: "https://images.unsplash.com/photo-1521119989659-a83eee488004?w=500",
        afterImageUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=500",
        tag: "Bengali Bride",
        description: "Intricate chandan forehead art with dramatic traditional eyes.",
      }
    ],
    certificate: {
      fileName: "kolkata_fine_style_cert.pdf",
      fileUrl: "https://res.cloudinary.com/djonmzyiu/image/upload/v1782465082/gvvmptwr4nw5cmrgdjbu.pdf",
      fileSize: 51000,
      fileType: "application/pdf",
      certificateNumber: "KOL-2019-123",
      instituteName: "Kolkata Institute of Fine Styling",
    },
    payment: {
      accountHolder: "Debasree Sen",
      bankName: "United Bank of India",
      accountNumber: "098765432107",
      ifscCode: "UTBI0GHT290",
      upiId: "debasree@okaxis",
    }
  },
  {
    name: "Meera Rathore Royal Beauty",
    email: "meera.jaipur@makeupglam.in",
    phone: "9812345608",
    profile: {
      profileImage: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150",
      gender: "Female",
      bio: "Specialized in royal Rajasthani and Rajputi poshak styling with heavy traditional bridal makeovers.",
      location: "Jaipur",
      experience: "9",
      parlourName: "Rajputana Queen Studio",
      parlourAddress: "MI Road, Jaipur - 302001",
      rating: 4.6,
      reviewCount: 60,
    },
    specializations: ["Rajputi Bridal", "Smokey Eyes", "Jewelry Styling"],
    services: [
      { specialization: "Rajputi Royal Bridal", duration: "4 hrs", timeRange: "7 AM - 11 AM", priceRange: "₹17,000" },
      { specialization: "Royal Smokey Event", duration: "2 hrs", timeRange: "1 PM - 8 PM", priceRange: "₹6,500" },
    ],
    portfolio: [
      {
        beforeImageUrl: "https://images.unsplash.com/photo-1548142813-c348350df52b?w=500",
        afterImageUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=500",
        tag: "Rajputi Royal",
        description: "Warm undertones and rich gold eyeshadow for Rajputi royal look.",
      }
    ],
    certificate: {
      fileName: "jaipur_salon_cert.pdf",
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
      upiId: "meera@okbaroda",
    }
  },
  {
    name: "Komal Shah Garba Makeovers",
    email: "komal.ahmedabad@makeupglam.in",
    phone: "9812345609",
    profile: {
      profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      gender: "Female",
      bio: "Renowned for vibrant Garba makeovers and elegant Gujarati Panetar bridal makeovers in Ahmedabad.",
      location: "Ahmedabad",
      experience: "5",
      parlourName: "Komal Shah Beauty Point",
      parlourAddress: "C.G. Road, Navrangpura, Ahmedabad - 380009",
      rating: 4.3,
      reviewCount: 29,
    },
    specializations: ["Garba Glam", "Bridal", "Heavy Glitter"],
    services: [
      { specialization: "Navratri Garba Special", duration: "1.5 hrs", timeRange: "3 PM - 10 PM", priceRange: "₹3,500" },
      { specialization: "Gujarati Panetar Bridal", duration: "3 hrs", timeRange: "9 AM - 2 PM", priceRange: "₹11,000" },
    ],
    portfolio: [
      {
        beforeImageUrl: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=500",
        afterImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500",
        tag: "Garba Queen",
        description: "Sweat-proof, highly colorful makeup for festive garba dancing.",
      }
    ],
    certificate: {
      fileName: "ahmedabad_academy_cert.pdf",
      fileUrl: "https://res.cloudinary.com/djonmzyiu/image/upload/v1782465082/gvvmptwr4nw5cmrgdjbu.pdf",
      fileSize: 41000,
      fileType: "application/pdf",
      certificateNumber: "AHM-2021-344",
      instituteName: "Ahmedabad Festive Art Academy",
    },
    payment: {
      accountHolder: "Komal Shah",
      bankName: "State Bank of India",
      accountNumber: "300012345609",
      ifscCode: "SBIN0003009",
      upiId: "komalshah@oksbi",
    }
  },
  {
    name: "Anjali Menon Bridal Lounge",
    email: "anjali.kochi@makeupglam.in",
    phone: "9812345610",
    profile: {
      profileImage: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150",
      gender: "Female",
      bio: "Specialized in the iconic white-and-gold Kasavu bridal makeover, creating stunning natural skin tones with fresh flowers.",
      location: "Kochi",
      experience: "8",
      parlourName: "Menon Bridal Lounge",
      parlourAddress: "MG Road, Ernakulam, Kochi - 682016",
      rating: 4.7,
      reviewCount: 84,
    },
    specializations: ["Kerala Kasavu Bridal", "Natural Glow", "Flowery Hairdo"],
    services: [
      { specialization: "Kasavu Golden Bridal", duration: "3.5 hrs", timeRange: "5 AM - 9 AM", priceRange: "₹13,000" },
      { specialization: "Pastel Engagement Look", duration: "2 hrs", timeRange: "10 AM - 6 PM", priceRange: "₹5,500" },
    ],
    portfolio: [
      {
        beforeImageUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500",
        afterImageUrl: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=500",
        tag: "Kerala Kasavu",
        description: "Soft peach makeup matching traditional white and gold saree.",
      }
    ],
    certificate: {
      fileName: "kochi_academy_cert.pdf",
      fileUrl: "https://res.cloudinary.com/djonmzyiu/image/upload/v1782465082/gvvmptwr4nw5cmrgdjbu.pdf",
      fileSize: 43000,
      fileType: "application/pdf",
      certificateNumber: "KOC-2018-090",
      instituteName: "Kerala Academy of Bridal Artistry",
    },
    payment: {
      accountHolder: "Anjali Menon",
      bankName: "Federal Bank",
      accountNumber: "10012345610",
      ifscCode: "FDRL0001001",
      upiId: "anjalim@okfederal",
    }
  },
  {
    name: "Harpreet Kaur Punjabi Glow",
    email: "harpreet.chd@makeupglam.in",
    phone: "9812345611",
    profile: {
      profileImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
      gender: "Female",
      bio: "Punjabi bridal expert who delivers heavy contouring, bold eyes, and glamorous base makeup.",
      location: "Chandigarh",
      experience: "7",
      parlourName: "Royal Punjabi Salon",
      parlourAddress: "Sector 17-C, Chandigarh - 160017",
      rating: 4.8,
      reviewCount: 104,
    },
    specializations: ["Punjabi Bridal", "Heavy Contour", "Glitter Eyes"],
    services: [
      { specialization: "Punjabi Heavy Bridal", duration: "3.5 hrs", timeRange: "6 AM - 12 PM", priceRange: "₹16,000" },
      { specialization: "Shimmery Party Glam", duration: "2 hrs", timeRange: "12 PM - 9 PM", priceRange: "₹6,000" },
    ],
    portfolio: [
      {
        beforeImageUrl: "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=500",
        afterImageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
        tag: "Punjabi Bride",
        description: "Bold pink lips and glittery eyes for traditional salwar suit look.",
      }
    ],
    certificate: {
      fileName: "chandigarh_cert.pdf",
      fileUrl: "https://res.cloudinary.com/djonmzyiu/image/upload/v1782465082/gvvmptwr4nw5cmrgdjbu.pdf",
      fileSize: 46000,
      fileType: "application/pdf",
      certificateNumber: "CHD-2019-543",
      instituteName: "Chandigarh Fashion Academy",
    },
    payment: {
      accountHolder: "Harpreet Kaur",
      bankName: "Punjab National Bank",
      accountNumber: "0112345611",
      ifscCode: "PUNB0011234",
      upiId: "harpreet@okpnb",
    }
  },
  {
    name: "Farhana Begum Awadhi Makeovers",
    email: "farhana.lko@makeupglam.in",
    phone: "9812345612",
    profile: {
      profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      gender: "Female",
      bio: "Renowned for soft Awadhi makeovers, classic winged liners, and elegant velvet touch foundations.",
      location: "Lucknow",
      experience: "10",
      parlourName: "Awadh Queen Artistry",
      parlourAddress: "Hazratganj, Lucknow - 226001",
      rating: 4.5,
      reviewCount: 48,
    },
    specializations: ["Awadhi Bridal", "Nude Look", "Classic Liner"],
    services: [
      { specialization: "Awadhi Royal Bridal", duration: "4 hrs", timeRange: "8 AM - 1 PM", priceRange: "₹15,000" },
      { specialization: "Classic Nawabi Look", duration: "1.5 hrs", timeRange: "10 AM - 8 PM", priceRange: "₹5,000" },
    ],
    portfolio: [
      {
        beforeImageUrl: "https://images.unsplash.com/photo-1504257404762-569612ee7859?w=500",
        afterImageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500",
        tag: "Awadhi Royalty",
        description: "Gold-dusted eyes and soft blush matching heavy Lucknowi chikankari.",
      }
    ],
    certificate: {
      fileName: "lucknow_design_cert.pdf",
      fileUrl: "https://res.cloudinary.com/djonmzyiu/image/upload/v1782465082/gvvmptwr4nw5cmrgdjbu.pdf",
      fileSize: 49000,
      fileType: "application/pdf",
      certificateNumber: "LKO-2015-776",
      instituteName: "Lucknow Royal Institute of Design",
    },
    payment: {
      accountHolder: "Farhana Begum",
      bankName: "HDFC Bank",
      accountNumber: "50100412345612",
      ifscCode: "HDFC0000080",
      upiId: "farhana@okhdfc",
    }
  },
  {
    name: "Jessica D'Souza Beach Glam",
    email: "jessica.goa@makeupglam.in",
    phone: "9812345613",
    profile: {
      profileImage: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150",
      gender: "Female",
      bio: "Top destination wedding makeup artist based in Goa. Master of waterproof, sweat-resistant, sun-kissed bridal makeup.",
      location: "Goa",
      experience: "6",
      parlourName: "Jessica's Beach Glam Studio",
      parlourAddress: "Colva Beach Road, Margao, Goa - 403601",
      rating: 4.8,
      reviewCount: 124,
    },
    specializations: ["Beach Wedding", "Sun-kissed Glam", "Waterproof Makeup"],
    services: [
      { specialization: "Beach Destination Bridal", duration: "3 hrs", timeRange: "1 PM - 6 PM", priceRange: "₹18,000" },
      { specialization: "Sun-kissed Bronze Party", duration: "1.5 hrs", timeRange: "12 PM - 8 PM", priceRange: "₹7,000" },
    ],
    portfolio: [
      {
        beforeImageUrl: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=500",
        afterImageUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500",
        tag: "Sun-kissed Glow",
        description: "Bronze-toned makeup perfect for outdoor sunset beach ceremonies.",
      }
    ],
    certificate: {
      fileName: "goa_beauty_cert.pdf",
      fileUrl: "https://res.cloudinary.com/djonmzyiu/image/upload/v1782465082/gvvmptwr4nw5cmrgdjbu.pdf",
      fileSize: 45000,
      fileType: "application/pdf",
      certificateNumber: "GOA-2020-098",
      instituteName: "Goa Academy of Beauty & Fashion",
    },
    payment: {
      accountHolder: "Jessica DSouza",
      bankName: "ICICI Bank",
      accountNumber: "00040112345613",
      ifscCode: "ICIC0000004",
      upiId: "jessica@okicici",
    }
  },
  {
    name: "Radhika Agrawal Festive Looks",
    email: "radhika.indore@makeupglam.in",
    phone: "9812345614",
    profile: {
      profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      gender: "Female",
      bio: "Specializing in Central Indian bridal looks, rich contouring, and modern festive hairstyles.",
      location: "Indore",
      experience: "5",
      parlourName: "Radhika's Beauty Zone",
      parlourAddress: "Vijay Nagar, Indore - 452010",
      rating: 4.4,
      reviewCount: 31,
    },
    specializations: ["Festive Glam", "Bridal", "Hair Braiding"],
    services: [
      { specialization: "Malwa Bridal Special", duration: "3 hrs", timeRange: "8 AM - 1 PM", priceRange: "₹10,000" },
      { specialization: "Festive Family Look", duration: "1.5 hrs", timeRange: "10 AM - 9 PM", priceRange: "₹4,500" },
    ],
    portfolio: [
      {
        beforeImageUrl: "https://images.unsplash.com/photo-1542103749-8ef59b94f47e?w=500",
        afterImageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500",
        tag: "Malwa Festive",
        description: "Bright festive look with red lips and long floral braid.",
      }
    ],
    certificate: {
      fileName: "indore_beauty_cert.pdf",
      fileUrl: "https://res.cloudinary.com/djonmzyiu/image/upload/v1782465082/gvvmptwr4nw5cmrgdjbu.pdf",
      fileSize: 42000,
      fileType: "application/pdf",
      certificateNumber: "IND-2021-125",
      instituteName: "Indore Beauty School",
    },
    payment: {
      accountHolder: "Radhika Agrawal",
      bankName: "Bank of India",
      accountNumber: "44012345614",
      ifscCode: "BKID0004401",
      upiId: "radhika@okboi",
    }
  },
  {
    name: "Neha Rawat Mountain Bridal",
    email: "neha.dehradun@makeupglam.in",
    phone: "9812345615",
    profile: {
      profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      gender: "Female",
      bio: "Famous for traditional Pahadi bridal transformations. Specializes in winter skin hydration techniques.",
      location: "Dehradun",
      experience: "6",
      parlourName: "Himalayan Glam Studio",
      parlourAddress: "Rajpur Road, Dehradun - 248001",
      rating: 4.6,
      reviewCount: 52,
    },
    specializations: ["Pahadi Bridal", "Matte Look", "Winter Hydration"],
    services: [
      { specialization: "Garhwali Pahadi Bridal", duration: "3.5 hrs", timeRange: "7 AM - 11 AM", priceRange: "₹12,000" },
      { specialization: "Dewy Winter Glow", duration: "2 hrs", timeRange: "10 AM - 6 PM", priceRange: "₹5,000" },
    ],
    portfolio: [
      {
        beforeImageUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=500",
        afterImageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500",
        tag: "Pahadi Nath Look",
        description: "Traditional look highlighting the large Garhwali nath.",
      }
    ],
    certificate: {
      fileName: "dehradun_cosmetology_cert.pdf",
      fileUrl: "https://res.cloudinary.com/djonmzyiu/image/upload/v1782465082/gvvmptwr4nw5cmrgdjbu.pdf",
      fileSize: 40000,
      fileType: "application/pdf",
      certificateNumber: "DEH-2020-044",
      instituteName: "Dehradun Institute of Cosmetology",
    },
    payment: {
      accountHolder: "Neha Rawat",
      bankName: "State Bank of India",
      accountNumber: "300012345615",
      ifscCode: "SBIN0003001",
      upiId: "neharawat@oksbi",
    }
  }
];

async function seed() {
  try {
    await sequelize.authenticate();
    console.log("✅ Connected to the database");

    console.log("🔄 Synchronizing database tables...");
    await sequelize.sync({ alter: true });
    console.log("✅ Database tables synchronized");

    // 1. Seed Clients (Customers)
    console.log("\n👤 Seeding Clients...");
    const clientHashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    let clientsCreated = 0;
    let clientsUpdated = 0;

    for (const c of sampleClients) {
      const existing = await Customer.findOne({ where: { email: c.email } });
      if (existing) {
        await existing.update({
          name: c.name,
          phone: c.phone,
          password: clientHashedPassword,
          profileImage: c.profileImage,
          role: "user"
        });
        clientsUpdated++;
      } else {
        await Customer.create({
          name: c.name,
          email: c.email,
          phone: c.phone,
          password: clientHashedPassword,
          profileImage: c.profileImage,
          role: "user"
        });
        clientsCreated++;
      }
    }
    console.log(`✅ Clients complete: Created ${clientsCreated}, Updated ${clientsUpdated}`);

    // 2. Seed Artists with related tables
    console.log("\n🎨 Seeding Artists and all required tables...");
    const artistHashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    let artistsCreated = 0;
    let artistsUpdated = 0;

    for (const artData of sampleArtists) {
      let artist = await Artist.findOne({ where: { email: artData.email } });

      if (artist) {
        // Update basic info
        await artist.update({
          name: artData.name,
          phone: artData.phone,
          password: artistHashedPassword,
          isVerified: true
        });
        artistsUpdated++;
      } else {
        // Create new
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

      // Sync Specializations (Clear old ones first to prevent duplicates)
      await ArtistSpecialization.destroy({ where: { artistId: artist.id } });
      for (const spec of artData.specializations) {
        await ArtistSpecialization.create({
          artistId: artist.id,
          name: spec
        });
      }

      // Sync Services (Clear old ones first)
      await ArtistService.destroy({ where: { artistId: artist.id } });
      for (const svc of artData.services) {
        await ArtistService.create({
          artistId: artist.id,
          ...svc
        });
      }

      // Sync Portfolio (Clear old ones first)
      await ArtistPortfolio.destroy({ where: { artistId: artist.id } });
      for (const port of artData.portfolio) {
        await ArtistPortfolio.create({
          artistId: artist.id,
          ...port
        });
      }

      // Sync Certificate (Clear old ones first)
      await ArtistCertificate.destroy({ where: { artistId: artist.id } });
      if (artData.certificate) {
        await ArtistCertificate.create({
          artistId: artist.id,
          ...artData.certificate
        });
      }

      // Sync Payment (Encrypt account number and IFSC code)
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

      console.log(`   - Populated artist: "${artist.name}" in ${artData.profile.location}`);
    }
    console.log(`✅ Artists complete: Created ${artistsCreated}, Updated/Synced ${artistsUpdated}`);

    // 3. Seed Bookings
    console.log("\n📅 Seeding Bookings...");
    const allCustomers = await Customer.findAll();
    const allArtists = await Artist.findAll();

    const seededCustomerIds = allCustomers
      .filter(c => c.email.endsWith("@gmail.com") && c.email !== "customer@test.com")
      .map(c => c.id);

    await Booking.destroy({
      where: {
        customerId: seededCustomerIds
      }
    });

    const categories = ["Bridal", "Party", "Engagement", "Photoshoot", "Creative"];
    let bookingsCreated = 0;

    const artistBookingCounts = [8, 12, 5, 3, 6, 10, 4, 2, 1, 7, 9, 0, 11, 2, 5];

    for (let i = 0; i < sampleArtists.length; i++) {
      const artData = sampleArtists[i];
      const artist = allArtists.find(a => a.email === artData.email);
      if (!artist) continue;

      const numBookings = artistBookingCounts[i] || 0;
      for (let b = 0; b < numBookings; b++) {
        const customerId = allCustomers[b % allCustomers.length].id;
        const date = new Date(Date.now() - (b + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const category = categories[b % categories.length];
        const status = "completed";

        await Booking.create({
          customerId,
          artistId: artist.id,
          date,
          time: "11:00 AM",
          category,
          price: 5000 + (b * 500),
          status,
          location: artData.profile.location,
          totalPaid: 5000 + (b * 500),
          advancePaid: true,
        });
        bookingsCreated++;
      }

      // Add one pending future booking
      const customerIdPending = allCustomers[i % allCustomers.length].id;
      const futureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      await Booking.create({
        customerId: customerIdPending,
        artistId: artist.id,
        date: futureDate,
        time: "02:00 PM",
        category: categories[i % categories.length],
        price: 6000,
        status: "pending",
        location: artData.profile.location,
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

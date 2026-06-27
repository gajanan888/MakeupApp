import bcrypt from "bcrypt";
import sequelize from "../src/config/db.js";
import Artist from "../src/models/Artist.js";
import ArtistProfile from "../src/models/ArtistProfile.js";
import ArtistSpecialization from "../src/models/ArtistSpecialization.js";
import ArtistService from "../src/models/ArtistService.js";

const sampleArtists = [
  {
    name: "Priya Makeup Studio",
    email: "priya@glamai.com",
    phone: "9876543210",
    password: "Test@1234",
    profile: {
      gender: "Female",
      bio: "Award-winning bridal makeup artist with 8+ years of experience. Specializing in traditional and modern bridal looks.",
      location: "Pune",
      experience: "8",
    },
    specializations: ["Bridal", "HD Makeup", "Airbrush"],
    services: [
      { specialization: "Bridal Makeup", duration: "3 hrs", timeRange: "6AM - 12PM", priceRange: "₹5,999 - ₹12,999" },
      { specialization: "HD Makeup", duration: "2 hrs", timeRange: "10AM - 8PM", priceRange: "₹2,999 - ₹5,999" },
    ],
  },
  {
    name: "Ananya Beauty",
    email: "ananya@glamai.com",
    phone: "9876543211",
    password: "Test@1234",
    profile: {
      gender: "Female",
      bio: "Creative party and event makeup specialist. Known for glamorous transformations and bold styles.",
      location: "Mumbai",
      experience: "5",
    },
    specializations: ["Party", "Engagement", "Reception"],
    services: [
      { specialization: "Party Makeup", duration: "1.5 hrs", timeRange: "12PM - 10PM", priceRange: "₹1,999 - ₹4,999" },
      { specialization: "Engagement Makeup", duration: "2 hrs", timeRange: "8AM - 6PM", priceRange: "₹3,499 - ₹7,999" },
    ],
  },
  {
    name: "Riya Makeovers",
    email: "riya@glamai.com",
    phone: "9876543212",
    password: "Test@1234",
    profile: {
      gender: "Female",
      bio: "HD and airbrush makeup expert. Celebrity-trusted artist for photoshoots and editorial looks.",
      location: "Delhi",
      experience: "6",
    },
    specializations: ["HD Makeup", "Photoshoot", "Celebrity"],
    services: [
      { specialization: "HD Makeup", duration: "2 hrs", timeRange: "9AM - 7PM", priceRange: "₹3,499 - ₹8,999" },
      { specialization: "Photoshoot Makeup", duration: "2.5 hrs", timeRange: "7AM - 5PM", priceRange: "₹4,599 - ₹10,999" },
    ],
  },
  {
    name: "Glow By Mehak",
    email: "mehak@glamai.com",
    phone: "9876543213",
    password: "Test@1234",
    profile: {
      gender: "Female",
      bio: "Airbrush makeup specialist with a passion for flawless, long-lasting looks. Perfect for destination weddings.",
      location: "Pune",
      experience: "7",
    },
    specializations: ["Airbrush", "Bridal", "Engagement"],
    services: [
      { specialization: "Airbrush Makeup", duration: "2.5 hrs", timeRange: "6AM - 2PM", priceRange: "₹4,299 - ₹9,999" },
      { specialization: "Bridal Makeup", duration: "3 hrs", timeRange: "5AM - 12PM", priceRange: "₹6,999 - ₹14,999" },
    ],
  },
  {
    name: "Lavish Looks",
    email: "lavish@glamai.com",
    phone: "9876543214",
    password: "Test@1234",
    profile: {
      gender: "Female",
      bio: "Engagement and pre-wedding makeup specialist. Creating dreamy looks for your special moments.",
      location: "Mumbai",
      experience: "4",
    },
    specializations: ["Engagement", "Party", "Minimal"],
    services: [
      { specialization: "Engagement Makeup", duration: "2 hrs", timeRange: "8AM - 6PM", priceRange: "₹2,499 - ₹5,999" },
      { specialization: "Party Makeup", duration: "1.5 hrs", timeRange: "4PM - 10PM", priceRange: "₹1,999 - ₹3,999" },
    ],
  },
  {
    name: "Blush Studio",
    email: "blush@glamai.com",
    phone: "9876543215",
    password: "Test@1234",
    profile: {
      gender: "Female",
      bio: "Celebrity makeup artist featured in Vogue and Elle. Premium looks for premium occasions.",
      location: "Bangalore",
      experience: "10",
    },
    specializations: ["Celebrity", "Bridal", "Photoshoot"],
    services: [
      { specialization: "Celebrity Makeup", duration: "2 hrs", timeRange: "Any Time", priceRange: "₹5,999 - ₹15,999" },
      { specialization: "Bridal Makeup", duration: "3.5 hrs", timeRange: "5AM - 11AM", priceRange: "₹8,999 - ₹19,999" },
    ],
  },
  {
    name: "Makeup By Ayesha",
    email: "ayesha@glamai.com",
    phone: "9876543216",
    password: "Test@1234",
    profile: {
      gender: "Female",
      bio: "Reception and cocktail party makeup expert. Bold, beautiful, and camera-ready looks every time.",
      location: "Hyderabad",
      experience: "5",
    },
    specializations: ["Reception", "Party", "HD Makeup"],
    services: [
      { specialization: "Reception Makeup", duration: "2 hrs", timeRange: "2PM - 10PM", priceRange: "₹3,299 - ₹7,999" },
      { specialization: "Party Makeup", duration: "1.5 hrs", timeRange: "5PM - 11PM", priceRange: "₹2,499 - ₹4,999" },
    ],
  },
  {
    name: "Elite Beauty Lounge",
    email: "elite@glamai.com",
    phone: "9876543217",
    password: "Test@1234",
    profile: {
      gender: "Female",
      bio: "Photoshoot and editorial makeup specialist. Working with top photographers across India.",
      location: "Pune",
      experience: "6",
    },
    specializations: ["Photoshoot", "Celebrity", "HD Makeup"],
    services: [
      { specialization: "Photoshoot Makeup", duration: "2 hrs", timeRange: "7AM - 5PM", priceRange: "₹4,599 - ₹9,999" },
      { specialization: "HD Makeup", duration: "1.5 hrs", timeRange: "10AM - 8PM", priceRange: "₹3,499 - ₹6,999" },
    ],
  },
  {
    name: "Noor Makeovers",
    email: "noor@glamai.com",
    phone: "9876543218",
    password: "Test@1234",
    profile: {
      gender: "Female",
      bio: "Traditional bridal specialist. Expert in Mughal-inspired, South Indian, and Rajasthani bridal looks.",
      location: "Delhi",
      experience: "9",
    },
    specializations: ["Bridal", "Engagement", "Reception"],
    services: [
      { specialization: "Traditional Bridal", duration: "4 hrs", timeRange: "4AM - 10AM", priceRange: "₹6,499 - ₹16,999" },
      { specialization: "Engagement Makeup", duration: "2.5 hrs", timeRange: "8AM - 4PM", priceRange: "₹4,999 - ₹9,999" },
    ],
  },
  {
    name: "Beauty Canvas",
    email: "canvas@glamai.com",
    phone: "9876543219",
    password: "Test@1234",
    profile: {
      gender: "Female",
      bio: "Minimal and no-makeup makeup expert. Enhancing your natural beauty with subtle, elegant techniques.",
      location: "Chennai",
      experience: "3",
    },
    specializations: ["Minimal", "Party", "Photoshoot"],
    services: [
      { specialization: "Minimal Makeup", duration: "1 hr", timeRange: "9AM - 7PM", priceRange: "₹2,199 - ₹4,499" },
      { specialization: "Natural Glam", duration: "1.5 hrs", timeRange: "10AM - 6PM", priceRange: "₹2,999 - ₹5,499" },
    ],
  },
];

async function seed() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");

    for (const data of sampleArtists) {
      // Check if artist with this email already exists
      const existing = await Artist.findOne({ where: { email: data.email } });
      if (existing) {
        console.log(`⏭  Skipping "${data.name}" (already exists)`);
        continue;
      }

      // Create artist
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const artist = await Artist.create({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        isVerified: true,
      });

      // Create profile
      await ArtistProfile.create({
        artistId: artist.id,
        ...data.profile,
      });

      // Create specializations
      for (const specName of data.specializations) {
        await ArtistSpecialization.create({
          artistId: artist.id,
          name: specName,
        });
      }

      // Create services
      for (const svc of data.services) {
        await ArtistService.create({
          artistId: artist.id,
          ...svc,
        });
      }

      console.log(`✅ Created "${data.name}" with profile, ${data.specializations.length} specializations, ${data.services.length} services`);
    }

    console.log("\n🎉 Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  }
}

seed();

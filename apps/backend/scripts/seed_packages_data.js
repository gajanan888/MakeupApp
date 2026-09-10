import sequelize from "../src/config/db.js";
import Brand from "../src/models/Brand.js";
import Service from "../src/models/Service.js";
import Product from "../src/models/Product.js";

const BRANDS = [
  "MAC", "NARS", "Estée Lauder", "Bobbi Brown", "Huda Beauty",
  "Charlotte Tilbury", "Dior", "Maybelline", "Lakmé", "Swiss Beauty",
  "Insight", "Blue Heaven", "Kay Beauty", "Nykaa Cosmetics",
  "Colorbar", "PAC", "Makeup Revolution"
];

const SERVICES = [
  "Makeup", "Hairstyling", "Saree Draping", "Lehenga/Dupatta Draping",
  "False Lashes", "Hair Extensions", "Basic Skin Preparation",
  "Advanced Skin Preparation", "Touch-up Kit", "Makeup Trial",
  "Consultation", "Waterproof Makeup", "HD Makeup", "Airbrush Makeup"
];

const PRODUCT_CATEGORIES = [
  "Primer", "Foundation", "Concealer", "Setting Powder", "Blush",
  "Contour", "Highlighter", "Eyeshadow", "Eyeliner", "Mascara",
  "Eyebrow Products", "Lipstick", "Lip Liner", "Setting Spray",
  "False Lashes", "Skincare / Prep Products", "Other"
];

const seedData = async () => {
  try {
    console.log("Authenticating database...");
    await sequelize.authenticate();
    console.log("Database connected.");

    console.log("Syncing models...");
    await Brand.sync();
    await Service.sync();
    await Product.sync();

    console.log("Seeding Brands...");
    for (const name of BRANDS) {
      await Brand.findOrCreate({ where: { name } });
    }
    console.log("Brands seeded.");

    console.log("Seeding Services...");
    for (const name of SERVICES) {
      await Service.findOrCreate({ where: { name } });
    }
    console.log("Services seeded.");

    // We could seed some generic products for each brand/category, 
    // but the artist can create them on the fly. 
    // We will just leave Product seeding empty or create a generic 'Custom Product' per brand?
    // Let's just create 1 product per brand/category as an example. 
    // Or it's better to let them create exactly what they use.

    console.log("Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
};

seedData();

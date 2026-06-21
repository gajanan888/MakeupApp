import bcrypt from "bcrypt";
import sequelize from "../src/config/db.js";
import Admin from "../src/models/Admin.js";

const adminsToSeed = [
  {
    name: "System Super Admin",
    email: "superadmin@glamai.com",
    password: "superpassword",
    role: "super_admin"
  },
  {
    name: "System Super Admin (Legacy)",
    email: "admin@glamai.com",
    password: "adminpassword",
    role: "super_admin"
  },
  {
    name: "Compliance Officer",
    email: "compliance@glamai.com",
    password: "compliancepassword",
    role: "compliance"
  },
  {
    name: "Customer Support Specialist",
    email: "support@glamai.com",
    password: "supportpassword",
    role: "support"
  },
  {
    name: "Financial Administrator",
    email: "finance@glamai.com",
    password: "financepassword",
    role: "finance"
  },
  {
    name: "System Technical Lead",
    email: "tech@glamai.com",
    password: "techpassword",
    role: "tech_lead"
  }
];

async function seedAdmin() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");

    // Sync database schema to register Admin role column
    await sequelize.sync({ alter: true });
    console.log("✅ Database schema synced");

    for (const item of adminsToSeed) {
      const existing = await Admin.findOne({ where: { email: item.email } });
      if (existing) {
        // Update password and role to keep it current
        const hashedPassword = await bcrypt.hash(item.password, 10);
        await existing.update({
          name: item.name,
          password: hashedPassword,
          role: item.role
        });
        console.log(`Updated existing admin: ${item.email}`);
      } else {
        const hashedPassword = await bcrypt.hash(item.password, 10);
        await Admin.create({
          name: item.name,
          email: item.email,
          password: hashedPassword,
          role: item.role
        });
        console.log(`Created new admin: ${item.email} (${item.role})`);
      }
    }

    console.log(`\n🎉 Admin users seeded successfully!`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding admin failed:", error.message);
    process.exit(1);
  }
}

seedAdmin();

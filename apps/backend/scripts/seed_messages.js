import bcrypt from "bcrypt";
import sequelize from "../src/config/db.js";
import Artist from "../src/models/Artist.js";
import Customer from "../src/models/Customer.js";
import Message from "../src/models/Message.js";

const chatHistory = [
  {
    name: "Sophia Laurent",
    email: "sophia@example.com",
    phone: "9999990001",
    messages: [
      { text: "Hi! I wanted to ask if you're available on 25 May for a bridal booking?", time: "10:30 AM", sender: "client" },
      { text: "Hi Sophia! Yes, I am available on 25 May.", time: "10:31 AM", sender: "artist" },
      { text: "Great! Also, do you provide HD makeup?", time: "10:32 AM", sender: "client" },
      { text: "Yes, HD makeup is included in the package.", time: "10:32 AM", sender: "artist" },
      { text: "Perfect! Let's confirm the booking then.", time: "10:33 AM", sender: "client" },
    ],
  },
  {
    name: "Anastasia Beverly",
    email: "anastasia@example.com",
    phone: "9999990002",
    messages: [
      { text: "Hey, can we check the timing?", time: "04:00 PM", sender: "client" },
      { text: "Sure, does 11 AM work?", time: "04:05 PM", sender: "artist" },
      { text: "Sure, see you then!", time: "Yesterday", sender: "client" },
    ],
  },
  {
    name: "Mia Makeup",
    email: "mia@example.com",
    phone: "9999990003",
    messages: [
      { text: "Here are the inspiration images.", time: "12 May", sender: "client" },
      { text: "Thank you so much!", time: "12 May", sender: "artist" },
    ],
  },
  {
    name: "Daniela Rose",
    email: "daniela@example.com",
    phone: "9999990004",
    messages: [
      { text: "Can we reschedule?", time: "12 May", sender: "client" },
    ],
  },
  {
    name: "Luna Glam",
    email: "luna@example.com",
    phone: "9999990005",
    messages: [
      { text: "Okay perfect", time: "10 May", sender: "client" },
    ],
  },
];

async function seed() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");

    // Find all artists
    const artists = await Artist.findAll();
    if (artists.length === 0) {
      console.error("❌ No Artists found in database!");
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash("Test@1234", 10);

    for (const artist of artists) {
      console.log(`\n🎨 Seeding messages for Artist: ${artist.name} (${artist.email})`);

      for (const chat of chatHistory) {
        // Find or create customer
        let customer = await Customer.findOne({ where: { email: chat.email } });
        if (!customer) {
          customer = await Customer.create({
            name: chat.name,
            email: chat.email,
            phone: chat.phone,
            password: hashedPassword,
            role: "user",
          });
          console.log(`  👤 Created Customer: ${chat.name}`);
        }

        // Add messages
        for (const msg of chat.messages) {
          const existing = await Message.findOne({
            where: {
              artistId: artist.id,
              customerId: customer.id,
              text: msg.text,
              sender: msg.sender,
            },
          });

          if (!existing) {
            await Message.create({
              artistId: artist.id,
              customerId: customer.id,
              sender: msg.sender,
              text: msg.text,
              time: msg.time,
            });
          }
        }
        console.log(`  ✉  Added messages for: ${chat.name}`);
      }
    }

    console.log("\n🎉 Message Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error.message || error);
    process.exit(1);
  }
}

seed();

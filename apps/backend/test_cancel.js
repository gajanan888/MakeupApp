import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const token = jwt.sign({ id: 3 }, process.env.JWT_SECRET, {
  expiresIn: "7d",
});

async function main() {
  try {
    const res = await axios.patch("http://localhost:5000/api/booking/3/cancel", {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log("Status:", res.status);
    console.log("Response data:", JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error("Error calling API:", err.response ? err.response.data : err.message);
  }
}
main();

import express from "express";
import axios from "axios";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

const consumer_key = "8B6dF76I61eLT9zcw3hC04YvbbzGO5HqaKrICwymvmIuENKF";
const consumer_secret = "WsngvMn2GGekiCEy4MbHbTS8MAfu3a85YwvRXHzD2kJ7DJlGbN1wKYWi09NPqYE9";
const shortCode = "174379"; // For testing, use Safaricom Paybill 174379
const passkey = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";

const authUrl = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
const stkUrl = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";

// Function to generate access token
async function getAccessToken() {
  const auth = Buffer.from(`${consumer_key}:${consumer_secret}`).toString("base64");
  const response = await axios.get(authUrl, {
    headers: { Authorization: `Basic ${auth}` },
  });
  return response.data.access_token;
}

// Payment endpoint
app.post("/pay", async (req, res) => {
  const { phone, coffee } = req.body;
  let amount = 150;
  if (coffee === "Cappuccino") amount = 200;
  if (coffee === "Espresso") amount = 180;

  try {
    const token = await getAccessToken();
    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, "")
      .slice(0, -3);
    const password = Buffer.from(shortCode + passkey + timestamp).toString("base64");

    const response = await axios.post(
      stkUrl,
      {
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: phone,
        PartyB: shortCode,
        PhoneNumber: phone,
        CallBackURL: "https://mydomain.com/mpesa/callback",
        AccountReference: "Coffee Haven",
        TransactionDesc: `Payment for ${coffee}`,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    res.json({ message: "Payment request sent! Check your phone to enter PIN." });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ message: "Error initiating payment." });
  }
});

app.listen(3000, () => console.log("✅ Coffee M-Pesa server running on port 3000"));

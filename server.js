require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const Stripe = require("stripe");

const app = express();
const PORT = process.env.PORT || 3000;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

if (!process.env.STRIPE_SECRET_KEY) {
  console.error("Missing STRIPE_SECRET_KEY in .env");
  process.exit(1);
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const { amount } = req.body;
    const amountCents = Math.round(Number(amount));
    if (!amountCents || amountCents < 50) {
      return res.status(400).json({ error: "Minimum donation is $0.50" });
    }
    if (amountCents > 9999999) {
      return res.status(400).json({ error: "Amount too large" });
    }

    const baseUrl = process.env.SITE_URL || `http://localhost:${PORT}`;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Donation to sports4all",
              description: "Thank you for supporting underprivileged kids through sports.",
              images: [],
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/index.html#donate?success=true`,
      cancel_url: `${baseUrl}/index.html#donate?canceled=true`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err.message);
    res.status(500).json({ error: "Could not create checkout session" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log("Open this URL in your browser to use the site and donate.");
});

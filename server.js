const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.static("public"));

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017";
const DB_NAME = process.env.DB_NAME || "wt2_assignment3";
const PORT = Number(process.env.PORT || 3000);

const client = new MongoClient(MONGO_URI);
let cars; 

function isValidObjectId(id) {
  return ObjectId.isValid(id) && String(new ObjectId(id)) === id;
}

function validateCar(body) {
  const errors = [];

  const brand = body?.brand;
  const model = body?.model;
  const year = body?.year;
  const price = body?.price;

  if (!brand || typeof brand !== "string" || brand.trim().length === 0) {
    errors.push("brand is required (string)");
  }

  if (!model || typeof model !== "string" || model.trim().length === 0) {
    errors.push("model is required (string)");
  }

  if (year === undefined || typeof year !== "number" || Number.isNaN(year)) {
    errors.push("year is required (number)");
  } else if (year < 1950 || year > 2100) {
    errors.push("year must be between 1950 and 2100");
  }

  if (price === undefined || typeof price !== "number" || Number.isNaN(price)) {
    errors.push("price is required (number)");
  } else if (price < 0) {
    errors.push("price must be >= 0");
  }

  return errors;
}

app.get("/api", (req, res) => {
  res.json({ message: "Auto dealership API is running" });
});

app.post("/api/cars", async (req, res) => {
  const errors = validateCar(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: "Bad Request", details: errors });
  }

  const now = new Date();
  const doc = {
    brand: req.body.brand.trim(),
    model: req.body.model.trim(),
    year: req.body.year,
    price: req.body.price,

    mileage: typeof req.body.mileage === "number" ? req.body.mileage : null,
    color: typeof req.body.color === "string" ? req.body.color.trim() : "",
    transmission: typeof req.body.transmission === "string" ? req.body.transmission.trim() : "",
    fuel: typeof req.body.fuel === "string" ? req.body.fuel.trim() : "",
    description: typeof req.body.description === "string" ? req.body.description.trim() : "",

    createdAt: now,
    updatedAt: now,
  };

  try {
    const result = await cars.insertOne(doc);
    return res.status(201).json({ ...doc, _id: result.insertedId });
  } catch (err) {
    return res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/cars", async (req, res) => {
  try {
    const list = await cars.find({}).sort({ createdAt: -1 }).toArray();
    return res.json({ count: list.length, cars: list });
  } catch (err) {
    return res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/cars/:id", async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }

  try {
    const item = await cars.findOne({ _id: new ObjectId(id) });
    if (!item) return res.status(404).json({ error: "Not Found" });
    return res.json(item);
  } catch (err) {
    return res.status(500).json({ error: "Database error" });
  }
});

app.put("/api/cars/:id", async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const errors = validateCar(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: "Bad Request", details: errors });
  }

  const update = {
    $set: {
      brand: req.body.brand.trim(),
      model: req.body.model.trim(),
      year: req.body.year,
      price: req.body.price,

      mileage: typeof req.body.mileage === "number" ? req.body.mileage : null,
      color: typeof req.body.color === "string" ? req.body.color.trim() : "",
      transmission: typeof req.body.transmission === "string" ? req.body.transmission.trim() : "",
      fuel: typeof req.body.fuel === "string" ? req.body.fuel.trim() : "",
      description: typeof req.body.description === "string" ? req.body.description.trim() : "",

      updatedAt: new Date(),
    },
  };

  try {
    const result = await cars.findOneAndUpdate(
      { _id: new ObjectId(id) },
      update,
      { returnDocument: "after" }
    );

    if (!result.value) return res.status(404).json({ error: "Not Found" });
    return res.json(result.value);
  } catch (err) {
    return res.status(500).json({ error: "Database error" });
  }
});

app.delete("/api/cars/:id", async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }

  try {
    const result = await cars.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Not Found" });
    }
    return res.json({ message: "Deleted successfully" });
  } catch (err) {
    return res.status(500).json({ error: "Database error" });
  }
});

app.use("/api", (req, res) => {
  res.status(404).json({ error: "API route not found" });
});

async function start() {
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    cars = db.collection("cars"); 

    app.listen(PORT, () => {
      console.log(`Server running: http://localhost:${PORT}`);
      console.log(`MongoDB: ${MONGO_URI}, DB: ${DB_NAME}, Collection: cars`);
    });
  } catch (err) {
    console.error("Failed to start:", err);
    process.exit(1);
  }
}

start();

const express = require("express");
const cors = require("cors");
require('dotenv').config();
const pool = require("./db");

const app = express();
const PORT = process.env.SERVER_PORT || 5000;

// Test database connection
pool.query("SELECT 1")
  .then(() => console.log("✅ Database connected successfully via PostgreSQL (pgAdmin compatible)"))
  .catch(err => {
    console.error("❌ DB connection error:", err.message);
    console.error("Make sure PostgreSQL is running and database exists");
  });

// Middlewares
app.use(cors());
app.use(express.json());

// Register API
app.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT * FROM public.users WHERE email=$1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    await pool.query(
      "INSERT INTO public.users (name, email, password, role) VALUES ($1,$2,$3,$4)",
      [name, email, password, role]
    );

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Registration error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Login API 
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM public.users WHERE email=$1 AND password=$2",
      [email, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      message: "Login successful",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Start Server 
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  console.log(`📊 pgAdmin is compatible with your PostgreSQL connection`);
});

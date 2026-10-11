const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        CustomerID,
        CustomerName,
        Email,
        Phone,
        City,
        RegistrationDate
      FROM Customer
      ORDER BY CustomerID DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error("GET /api/customers:", error);
    res.status(500).json({ message: "Unable to fetch customers." });
  }
});

module.exports = router;

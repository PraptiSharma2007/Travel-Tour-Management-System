const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        DestinationID,
        DestinationName,
        State,
        Country,
        Description,
        BestTimeToVisit
      FROM Destination
      ORDER BY DestinationID
    `);
    res.json(rows);
  } catch (error) {
    console.error("GET /api/destinations:", error);
    res.status(500).json({ message: "Unable to fetch destinations." });
  }
});

module.exports = router;

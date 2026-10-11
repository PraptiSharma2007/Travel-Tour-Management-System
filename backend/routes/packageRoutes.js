const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        p.PackageID,
        p.PackageName,
        p.DestinationID,
        p.DurationDays,
        p.Price,
        p.TotalSeats,
        p.AvailableSeats,
        p.PackageStatus,
        d.DestinationName,
        d.State,
        d.Country
      FROM TourPackage p
      INNER JOIN Destination d
        ON p.DestinationID = d.DestinationID
      ORDER BY p.PackageID
    `);
    res.json(rows);
  } catch (error) {
    console.error("GET /api/packages:", error);
    res.status(500).json({ message: "Unable to fetch tour packages." });
  }
});

module.exports = router;

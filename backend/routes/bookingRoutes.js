const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        b.BookingID,
        b.CustomerID,
        b.PackageID,
        b.BookingDate,
        b.NumberOfPeople,
        b.TotalAmount,
        b.BookingStatus,
        c.CustomerName,
        c.Email,
        p.PackageName,
        d.DestinationName
      FROM Booking b
      INNER JOIN Customer c
        ON b.CustomerID = c.CustomerID
      INNER JOIN TourPackage p
        ON b.PackageID = p.PackageID
      INNER JOIN Destination d
        ON p.DestinationID = d.DestinationID
      ORDER BY b.BookingID DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error("GET /api/bookings:", error);
    res.status(500).json({ message: "Unable to fetch bookings." });
  }
});

router.post("/", async (req, res) => {
  const { CustomerID, PackageID, NumberOfPeople, TotalAmount } = req.body;

  const customerId = Number(CustomerID);
  const packageId = Number(PackageID);
  const people = Number(NumberOfPeople);
  const total = Number(TotalAmount);

  if (!Number.isInteger(customerId) || !Number.isInteger(packageId) ||
      !Number.isInteger(people) || people <= 0 ||
      !Number.isFinite(total) || total < 0) {
    return res.status(400).json({
      message: "CustomerID, PackageID, NumberOfPeople and TotalAmount are required and must be valid."
    });
  }

  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [customers] = await connection.query(
      "SELECT CustomerID FROM Customer WHERE CustomerID = ?",
      [customerId]
    );

    if (customers.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: "Customer does not exist." });
    }

    const [packages] = await connection.query(
      `SELECT PackageID, PackageName, Price, AvailableSeats, PackageStatus
       FROM TourPackage
       WHERE PackageID = ?
       FOR UPDATE`,
      [packageId]
    );

    if (packages.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: "Tour package does not exist." });
    }

    const pkg = packages[0];

    if (String(pkg.PackageStatus).toLowerCase() !== "available") {
      await connection.rollback();
      return res.status(400).json({ message: "This tour package is not available for booking." });
    }

    if (people > Number(pkg.AvailableSeats)) {
      await connection.rollback();
      return res.status(400).json({
        message: `Only ${pkg.AvailableSeats} seat(s) are available for this package.`
      });
    }

    const expectedTotal = Number(pkg.Price) * people;
    if (Math.abs(total - expectedTotal) > 0.01) {
      await connection.rollback();
      return res.status(400).json({
        message: "Total amount does not match the selected package price and number of people."
      });
    }

    const [result] = await connection.query(
      `INSERT INTO Booking
       (CustomerID, PackageID, NumberOfPeople, TotalAmount, BookingStatus)
       VALUES (?, ?, ?, ?, 'Confirmed')`,
      [customerId, packageId, people, total]
    );

    await connection.query(
      `UPDATE TourPackage
       SET AvailableSeats = AvailableSeats - ?
       WHERE PackageID = ?`,
      [people, packageId]
    );

    await connection.commit();

    const [created] = await db.query(`
      SELECT
        b.BookingID,
        b.CustomerID,
        b.PackageID,
        b.BookingDate,
        b.NumberOfPeople,
        b.TotalAmount,
        b.BookingStatus,
        c.CustomerName,
        p.PackageName,
        d.DestinationName
      FROM Booking b
      INNER JOIN Customer c ON b.CustomerID = c.CustomerID
      INNER JOIN TourPackage p ON b.PackageID = p.PackageID
      INNER JOIN Destination d ON p.DestinationID = d.DestinationID
      WHERE b.BookingID = ?
    `, [result.insertId]);

    res.status(201).json({
      message: "Booking created successfully.",
      booking: created[0]
    });
  } catch (error) {
    if (connection) {
      try { await connection.rollback(); } catch (_) {}
    }
    console.error("POST /api/bookings:", error);
    res.status(500).json({ message: "Unable to create booking." });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;

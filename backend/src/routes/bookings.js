const express = require("express");
const pool = require("../db/pool");

const router = express.Router();

router.post("/", async (req, res) => {
  const { hold_id } = req.body;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Lock hold
    const hold = await client.query(
      `
      SELECT seat_id, user_email
      FROM seat_holds
      WHERE id = $1
        AND expires_at > NOW()
      FOR UPDATE
      `,
      [hold_id]
    );

    if (hold.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Invalid or expired hold" });
    }

    const { seat_id, user_email } = hold.rows[0];

    // Lock seat
    const seat = await client.query(
      "SELECT status FROM seats WHERE id = $1 FOR UPDATE",
      [seat_id]
    );

    if (seat.rows[0].status !== "held") {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Seat not held" });
    }

    // Create booking
    const bookingRes = await client.query(
      `
      INSERT INTO bookings (seat_id, user_email)
      VALUES ($1, $2)
      RETURNING id
      `,
      [seat_id, user_email]
    );

    // Seat → booked
    await client.query("UPDATE seats SET status = 'booked' WHERE id = $1", [
      seat_id,
    ]);

    // Delete hold
    await client.query("DELETE FROM seat_holds WHERE id = $1", [hold_id]);

    await client.query("COMMIT");

    res.json({ booking_id: bookingRes.rows[0].id });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("BOOKING ERROR:", err);
    res.status(500).json({ error: "Booking failed" });
  } finally {
    client.release();
  }
});

module.exports = router;
  
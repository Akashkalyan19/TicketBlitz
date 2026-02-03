const express = require("express");
const pool = require("../db/pool");

const router = express.Router();

router.post("/", async (req, res) => {
  const { booking_id } = req.body;
  const idempotency_key = req.headers["idempotency-key"];

  if (!idempotency_key) {
    return res.status(400).json({ error: "Missing idempotency key" });
  }

  const client = await pool.connect();

  try {
    const bookingCheck = await client.query(
      "SELECT * FROM bookings WHERE id = $1",
      [booking_id]
    );

    if (bookingCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Booking not found" });
    }
    await client.query("BEGIN");

    const existing = await client.query(
      "SELECT * FROM payments WHERE idempotency_key = $1",
      [idempotency_key]
    );

    if (existing.rows.length > 0) {
      await client.query("COMMIT");
      return res.json(existing.rows[0]);
    }

    const paymentRes = await client.query(
      `
      INSERT INTO payments (booking_id, idempotency_key, status)
      VALUES ($1, $2, 'pending')
      RETURNING id
      `,
      [booking_id, idempotency_key]
    );

    const success = Math.random() > 0.3;

    if (!success) {
      await client.query(
        "UPDATE payments SET status = 'failed' WHERE id = $1",
        [paymentRes.rows[0].id]
      );
      await client.query("COMMIT");
      return res.status(500).json({ error: "Payment failed" });
    }

    await client.query("UPDATE payments SET status = 'success' WHERE id = $1", [
      paymentRes.rows[0].id,
    ]);

    await client.query("COMMIT");
    res.json({ status: "success" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("PAYMENT ERROR:", err);
    res.status(500).json({ error: "Payment error" });
  } finally {
    client.release();
  }
});

module.exports = router;

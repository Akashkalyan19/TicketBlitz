const express = require("express");
const pool = require("../db/pool");

const router = express.Router();

router.post("/", async (req, res) => {
  const { seat_id, user_email } = req.body;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Lock seat
    const seat = await client.query(
      "SELECT status FROM seats WHERE id = $1 FOR UPDATE",
      [seat_id]
    );

    if (seat.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Seat not found" });
    }

    if (seat.rows[0].status !== "available") {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Seat not available" });
    }

    // Create hold
    const holdRes = await client.query(
      `
      INSERT INTO seat_holds (seat_id, user_email, expires_at)
      VALUES ($1, $2, NOW() + INTERVAL '10 minutes')
      RETURNING id
      `,
      [seat_id, user_email]
    );

    await client.query("UPDATE seats SET status = 'held' WHERE id = $1", [
      seat_id,
    ]);

    await client.query("COMMIT");

    res.json({ hold_id: holdRes.rows[0].id });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("HOLD ERROR:", err);
    res.status(500).json({ error: "Hold failed" });
  } finally {
    client.release();
  }
});

module.exports = router;

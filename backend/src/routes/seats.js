const express = require("express");
const pool = require("../db/pool");

const router = express.Router();

// GET /seats?event_id=X - Get all seats for an event
router.get("/", async (req, res) => {
  const { event_id } = req.query;

  if (!event_id) {
    return res.status(400).json({ error: "event_id query parameter required" });
  }

  try {
    // Get seats with hold expiry info for user's holds
    const result = await pool.query(`
      SELECT 
        s.id,
        s.seat_number,
        s.status,
        s.event_id,
        sh.user_email as held_by,
        sh.expires_at as hold_expires_at
      FROM seats s
      LEFT JOIN seat_holds sh ON s.id = sh.seat_id AND sh.expires_at > NOW()
      WHERE s.event_id = $1
      ORDER BY s.seat_number ASC
    `, [event_id]);

    res.json(result.rows);
  } catch (err) {
    console.error("SEATS LIST ERROR:", err);
    res.status(500).json({ error: "Failed to fetch seats" });
  }
});

module.exports = router;

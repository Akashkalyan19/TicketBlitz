const express = require("express");
const pool = require("../db/pool");

const router = express.Router();

// GET /events - List all events with seat counts
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        e.id,
        e.title,
        e.event_date,
        e.created_at,
        COUNT(s.id) as total_seats,
        COUNT(CASE WHEN s.status = 'available' THEN 1 END) as available_seats,
        COUNT(CASE WHEN s.status = 'held' THEN 1 END) as held_seats,
        COUNT(CASE WHEN s.status = 'booked' THEN 1 END) as booked_seats
      FROM events e
      LEFT JOIN seats s ON e.id = s.event_id
      GROUP BY e.id
      ORDER BY e.event_date ASC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("EVENTS LIST ERROR:", err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// GET /events/:id - Get single event details
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(`
      SELECT 
        e.id,
        e.title,
        e.event_date,
        e.created_at,
        COUNT(s.id) as total_seats,
        COUNT(CASE WHEN s.status = 'available' THEN 1 END) as available_seats,
        COUNT(CASE WHEN s.status = 'held' THEN 1 END) as held_seats,
        COUNT(CASE WHEN s.status = 'booked' THEN 1 END) as booked_seats
      FROM events e
      LEFT JOIN seats s ON e.id = s.event_id
      WHERE e.id = $1
      GROUP BY e.id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("EVENT DETAIL ERROR:", err);
    res.status(500).json({ error: "Failed to fetch event" });
  }
});

module.exports = router;

/**
 * Seed script
 * Resets DB and inserts:
 * - 1 event
 * - 100 seats (seat_number: 1 → 100)
 */

require("dotenv").config();
const pool = require("./src/db/pool");

async function seed() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Reset DB (dev only)
    await client.query(`
      TRUNCATE
        payments,
        seat_holds,
        bookings,
        seats,
        events
      RESTART IDENTITY CASCADE
    `);

    // Create event
    const eventRes = await client.query(
      `
      INSERT INTO events (title, event_date)
      VALUES ($1, $2)
      RETURNING id
      `,
      ["Test Event", new Date(Date.now() + 24 * 60 * 60 * 1000)]
    );

    const eventId = eventRes.rows[0].id;

    // Create 100 seats
    const seatValues = [];
    const params = [];

    for (let i = 1; i <= 100; i++) {
      params.push(eventId, i);
      seatValues.push(
        `($${params.length - 1}, $${params.length}, 'available')`
      );
    }

    await client.query(
      `
      INSERT INTO seats (event_id, seat_number, status)
      VALUES ${seatValues.join(", ")}
      `,
      params
    );

    await client.query("COMMIT");

    console.log("✅ Seed complete");
    console.log({
      eventId,
      seatsCreated: 100,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Seed failed:", err);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

seed();

const pool = require("../db/pool");

async function recoverStuckPayments() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const stuck = await client.query(`
      SELECT p.id, b.seat_id
      FROM payments p
      JOIN bookings b ON b.id = p.booking_id
      WHERE p.status = 'pending'
        AND p.created_at < now() - interval '5 minutes'
    `);

    for (const row of stuck.rows) {
      await client.query(
        "UPDATE payments SET status = 'failed' WHERE id = $1",
        [row.id]
      );

      await client.query(
        "UPDATE seats SET status = 'available' WHERE id = $1",
        [row.seat_id]
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Recovery failed", err);
  } finally {
    client.release();
  }
}

setInterval(recoverStuckPayments, 2 * 60 * 1000);

const pool = require("../db/pool");

async function cleanupExpiredHolds() {
  const client = await pool.connect();

  try {
    while (true) {
      await client.query("BEGIN");

      // 1. Lock ONE expired hold
      const result = await client.query(`
        SELECT id, seat_id
        FROM seat_holds
        WHERE expires_at <= NOW()
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      `);

      if (result.rows.length === 0) {
        await client.query("COMMIT");
        break;
      }

      const { id, seat_id } = result.rows[0];

      // 2. Lock the seat
      await client.query("SELECT id FROM seats WHERE id = $1 FOR UPDATE", [
        seat_id,
      ]);

      // 3. Delete the hold
      await client.query("DELETE FROM seat_holds WHERE id = $1", [id]);

      // 4. Restore seat availability
      await client.query(
        "UPDATE seats SET status = 'available' WHERE id = $1 AND status = 'held'",
        [seat_id]
      );

      await client.query("COMMIT");
      console.log(`Released expired hold for seat ${seat_id}`);
    }
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Hold cleanup failed:", err.message);
  } finally {
    client.release();
  }
}

setInterval(cleanupExpiredHolds, 60 * 1000);

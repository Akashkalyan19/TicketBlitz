require("dotenv").config();
const axios = require("axios");
const pool = require("./src/db/pool");

const BASE_URL = "http://localhost:3000";
const CONCURRENCY = 20;

async function attempt(i, seatId) {
  await new Promise((r) => setTimeout(r, 100));

  try {
    const holdRes = await axios.post(`${BASE_URL}/holds`, {
      seat_id: seatId,
      user_email: `user${i}@test.com`,
    });

    const holdId = holdRes.data.hold_id;

    const bookingRes = await axios.post(`${BASE_URL}/bookings`, {
      hold_id: holdId,
    });

    const bookingId = bookingRes.data.booking_id;

    const idempotencyKey = "payment-key-1";

    await axios.post(
      `${BASE_URL}/payments`,
      { booking_id: bookingId },
      { headers: { "Idempotency-Key": idempotencyKey } }
    );

    await axios.post(
      `${BASE_URL}/payments`,
      { booking_id: bookingId },
      { headers: { "Idempotency-Key": idempotencyKey } }
    );

    return { success: true };
  } catch {
    return { success: false };
  }
}

async function run() {
  const seatRes = await pool.query("SELECT id FROM seats ORDER BY id LIMIT 1");

  if (seatRes.rows.length === 0) {
    throw new Error("No seats found. Run seed.js first.");
  }

  const seatId = seatRes.rows[0].id;
  console.log("Running concurrent test on seat:", seatId);

  const results = await Promise.all(
    Array.from({ length: CONCURRENCY }, (_, i) => attempt(i, seatId))
  );

  const successes = results.filter((r) => r.success).length;
  const failures = results.length - successes;

  console.log({ successes, failures });

  const seat = await pool.query("SELECT status FROM seats WHERE id = $1", [
    seatId,
  ]);

  const holds = await pool.query(
    "SELECT * FROM seat_holds WHERE seat_id = $1",
    [seatId]
  );

  const bookings = await pool.query(
    "SELECT * FROM bookings WHERE seat_id = $1",
    [seatId]
  );

  const payments = await pool.query("SELECT * FROM payments");

  console.log("Final DB State:");
  console.log({
    seatStatus: seat.rows[0].status,
    activeHolds: holds.rows.length,
    bookings: bookings.rows.length,
    payments: payments.rows.length,
  });

  if (
    seat.rows[0].status !== "booked" ||
    holds.rows.length !== 0 ||
    bookings.rows.length !== 1 ||
    payments.rows.length !== 1
  ) {
    throw new Error("❌ DB INVARIANT VIOLATION");
  }

  console.log("✅ DB invariants hold under concurrency");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

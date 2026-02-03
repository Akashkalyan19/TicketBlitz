# Concurrent Seat Booking System

A production-grade seat booking API built to handle high-concurrency scenarios without race conditions. Implements row-level locking, idempotent payments, and automatic recovery mechanisms.

## 🎯 The Problem

When multiple users attempt to book the same seat simultaneously, naive implementations create duplicate bookings. This system solves that challenge using database transactions and row-level locking.

**Proof of the problem:**

- Initial naive implementation: 20 concurrent requests → 4 bookings for same seat ❌
- After implementing locking: 20 concurrent requests → 1 booking ✅

## 🔧 Technical Highlights

### 1. Zero Race Conditions

- **Pattern:** `SELECT ... FOR UPDATE` with transactions
- **Result:** Tested with 20 concurrent users - exactly 1 successful booking
- **How it works:** Row-level locks prevent other transactions from reading the same seat until the first transaction commits

### 2. Idempotent Payment Processing

- **Problem:** Network failures cause payment retries
- **Solution:** Unique idempotency keys ensure same request = same result
- **Benefit:** Users can safely retry failed payments without being charged twice

### 3. Automatic Hold Expiry

- **Feature:** Seats held for 10 minutes, then auto-released
- **Implementation:** Background job using `SKIP LOCKED` pattern
- **Benefit:** Prevents users from blocking seats indefinitely

### 4. Crash Recovery

- **Scenario:** Server crashes during payment processing
- **Solution:** Recovery job finds stuck payments (>5 min) and fails them
- **Result:** No orphaned bookings or permanently locked seats

## 📊 Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│         Express API                 │
│  ┌──────────┐  ┌──────────────┐     │
│  │  Holds   │→ │   Bookings   │     │
│  │ (10 min) │  │  +Payments   │     │
│  └──────────┘  └──────────────┘     │
└─────────┬───────────────────────────┘
          │
          ▼
    ┌──────────┐         ┌─────────────────┐
    │PostgreSQL│◄────────┤ Background Jobs │
    │ +Locking │         │  - Cleanup      │
    │ +ACID    │         │  - Recovery     │
    └──────────┘         └─────────────────┘
```

## 🗄️ Database Schema

**State Machine:**

```
available → held (10 min) → booked
    ↑           │
    └───────────┘ (timeout)
```

**Tables:**

- `events` - Concert/movie events
- `seats` - Individual seats with status (available/held/booked)
- `seat_holds` - Temporary reservations with expiry
- `bookings` - Confirmed bookings
- `payments` - Payment records with idempotency keys

## 🚀 Getting Started

### Prerequisites

- Node.js 16+
- PostgreSQL 14+

### Installation

```bash
# Clone repo
git clone https://github.com/Akashkalyan19/TicketBlitz.git
cd backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Create database
psql -U postgres -c "CREATE DATABASE seat_booking"

# Run schema
psql -U postgres -d seat_booking -f schema.sql

# Start server
npm start

# Open another terminal to backend & Seed data (1 event, 100 seats)
node seed.js

```

### Testing Concurrency

```bash
# Run concurrent booking test
node test-concurrent.js

# Expected output:
# ✅ DB invariants hold under concurrency
```

## 🔍 API Endpoints

### Create Hold

```http
POST /holds
Content-Type: application/json

{
  "seat_id": 1,
  "user_email": "user@example.com"
}

Response: { "hold_id": 123 }
```

### Create Booking

```http
POST /bookings
Content-Type: application/json

{
  "hold_id": 123
}

Response: { "booking_id": 456 }
```

### Process Payment

```http
POST /payments
Content-Type: application/json
Idempotency-Key: unique-key-123   #dont forget to add this in headers

{
  "booking_id": 456
}

Response: { "status": "success" }
```

## 🐛 Key Bugs Fixed

### Race Condition in Naive Implementation

**Problem:**

```javascript
// Two requests read simultaneously
const seat = await query("SELECT * FROM seats WHERE id = 1");
if (seat.status === "available") {
  await query("UPDATE seats SET status = 'booked' WHERE id = 1");
}
// Both see 'available' → both book!
```

**Solution:**

```javascript
await client.query("BEGIN");
const seat = await client.query(
  "SELECT * FROM seats WHERE id = $1 FOR UPDATE",
  [seat_id]
);
// Row is locked - other requests wait
// ... validation and updates ...
await client.query("COMMIT");
```

## 🏗️ Architecture Decisions

### Why PostgreSQL over NoSQL?

ACID transactions and row-level locking are critical for preventing race conditions. NoSQL databases sacrifice consistency for availability - inappropriate for booking systems where double-booking is unacceptable.

### Why Status Enum over Boolean?

```sql
-- ✅ Flexible state machine
status TEXT CHECK (status IN ('available', 'held', 'booked'))

-- ❌ Limited to two states
is_booked BOOLEAN
```

Enum allows future states (e.g., 'maintenance', 'reserved') without schema changes.

### Why Hold + Booking Pattern?

- **Holds:** Temporary reservations, auto-expire
- **Bookings:** Permanent after payment
- **Benefit:** Prevents seats from being permanently locked by abandoned carts

### Why SKIP LOCKED in Cleanup Job?

Allows multiple cleanup workers to run concurrently without blocking each other. Each worker processes different holds in parallel.

## 📈 Performance Characteristics

- **Concurrent Requests:** Handles 20+ simultaneous bookings safely
- **Lock Contention:** Minimal - only locks specific seat rows
- **Cleanup Frequency:** Every 60 seconds
- **Recovery Frequency:** Every 2 minutes
- **Hold Duration:** 10 minutes

## 💡 What I Learned

1. **Race conditions only appear under load** - Single-threaded testing won't catch them
2. **Transactions alone don't prevent race conditions** - Need row-level locking
3. **Idempotency is non-negotiable for payments** - Network failures are common
4. **Background jobs need careful error handling** - One failure shouldn't stop the entire job
5. **State machines make bugs impossible** - Database constraints enforce valid transitions

## 🔮 Future Improvements

- [ ] Add structured logging (Winston/Pino)
- [ ] Implement metrics endpoint for monitoring
- [ ] Add rate limiting per user
- [ ] Queue system for high-traffic events (Redis/BullMQ)
- [ ] WebSocket notifications for real-time seat availability
- [ ] Multi-event support with seat maps
- [ ] React frontend with visual seat selection

## 📚 Technologies Used

- **Runtime:** Node.js 18
- **Framework:** Express.js
- **Database:** PostgreSQL 14
- **Testing:** Custom concurrent test scripts
- **Background Jobs:** Node.js `setInterval` (production would use BullMQ/pg-boss)

## 📝 License

MIT

CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE seats (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id),
  seat_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'held', 'booked')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (event_id, seat_number)
);

CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  seat_id INTEGER NOT NULL REFERENCES seats(id),
  user_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE seat_holds (
  id SERIAL PRIMARY KEY,
  seat_id INTEGER NOT NULL REFERENCES seats(id),
  user_email TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL REFERENCES bookings(id),
  idempotency_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

const express = require("express");
const cors = require("cors");

const bookingsRoute = require("./routes/bookings.js");
const holdsRoute = require("./routes/holds");
const paymentsRoute = require("./routes/payments");
const eventsRoute = require("./routes/events");
const seatsRoute = require("./routes/seats");

const app = express();

// Enable CORS for frontend
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true
}));

app.use(express.json());

// Routes
app.use("/events", eventsRoute);
app.use("/seats", seatsRoute);
app.use("/bookings", bookingsRoute);
app.use("/holds", holdsRoute);
app.use("/payments", paymentsRoute);

module.exports = app;

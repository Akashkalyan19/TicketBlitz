const express = require("express");
const cors = require("cors");

const bookingsRoute = require("./routes/bookings.js");
const holdsRoute = require("./routes/holds");
const paymentsRoute = require("./routes/payments");
const eventsRoute = require("./routes/events");
const seatsRoute = require("./routes/seats");

const app = express();


app.use(cors());

app.use(express.json());

// Routes
app.use("/events", eventsRoute);
app.use("/seats", seatsRoute);
app.use("/bookings", bookingsRoute);
app.use("/holds", holdsRoute);
app.use("/payments", paymentsRoute);

module.exports = app;

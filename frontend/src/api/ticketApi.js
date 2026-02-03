import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Events API
export const getEvents = async () => {
  const response = await api.get('/events');
  return response.data;
};

export const getEvent = async (eventId) => {
  const response = await api.get(`/events/${eventId}`);
  return response.data;
};

// Seats API
export const getSeats = async (eventId) => {
  const response = await api.get(`/seats?event_id=${eventId}`);
  return response.data;
};

// Holds API
export const createHold = async (seatId, userEmail) => {
  const response = await api.post('/holds', {
    seat_id: seatId,
    user_email: userEmail,
  });
  return response.data;
};

// Bookings API
export const createBooking = async (holdId) => {
  const response = await api.post('/bookings', {
    hold_id: holdId,
  });
  return response.data;
};

// Payments API
export const processPayment = async (bookingId, idempotencyKey) => {
  const response = await api.post('/payments', 
    { booking_id: bookingId },
    { headers: { 'Idempotency-Key': idempotencyKey } }
  );
  return response.data;
};

// Generate unique idempotency key
export const generateIdempotencyKey = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

export default api;

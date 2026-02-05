import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getEvents } from "../api/ticketApi";

export default function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const data = await getEvents();
      setEvents(data);
    } catch (err) {
      setError("Failed to load events.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div
            className="spinner mx-auto mb-4"
            style={{ width: 48, height: 48 }}
          ></div>
          <p className="text-slate-400">Loading events...</p>
          <p>
            Backend is hosted on Render and may be sleeping. Please wait a min .
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="glass-card p-8 max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Connection Error</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              setError("");
              fetchEvents();
            }}
            className="px-6 py-2 rounded-lg btn-gradient text-white font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Book Your Perfect Seat</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Experience seamless, concurrent-safe seat booking. Our system
            handles thousands of simultaneous requests without any race
            conditions.
          </p>
        </div>

        {/* Events List */}
        {events.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <h3 className="text-xl font-bold mb-2">No Events Available</h3>
            <p className="text-slate-400">
              Check back later for upcoming events!
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {events.map((event) => (
              <Link
                key={event.id}
                to={`/event/${event.id}`}
                className="glass-card p-6 group hover:border-indigo-500/50 transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Event Info */}
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2 group-hover:text-indigo-400 transition-colors">
                      {event.title}
                    </h2>
                    <div className="flex items-center gap-2 text-slate-400">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>{formatDate(event.event_date)}</span>
                    </div>
                  </div>

                  {/* Seat Stats */}
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-400">
                        {event.available_seats}
                      </div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider">
                        Available
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-400">
                        {event.held_seats}
                      </div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider">
                        Held
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-400">
                        {event.booked_seats}
                      </div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider">
                        Booked
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="hidden md:block">
                      <svg
                        className="w-6 h-6 text-slate-400 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Features Section */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          <div className="glass-card p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-indigo-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="font-bold mb-2">Lightning Fast</h3>
            <p className="text-sm text-slate-400">
              Handles concurrent requests with zero race conditions
            </p>
          </div>

          <div className="glass-card p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h3 className="font-bold mb-2">Secure Payments</h3>
            <p className="text-sm text-slate-400">
              Idempotent payment processing prevents double charges
            </p>
          </div>

          <div className="glass-card p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="font-bold mb-2">Auto-Release</h3>
            <p className="text-sm text-slate-400">
              Held seats automatically release after 10 minutes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

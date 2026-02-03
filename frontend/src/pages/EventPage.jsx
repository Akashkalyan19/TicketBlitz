import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEvent, getSeats } from '../api/ticketApi';
import SeatGrid from '../components/SeatGrid';
import BookingModal from '../components/BookingModal';

export default function EventPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [userEmail, setUserEmail] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [eventData, seatsData] = await Promise.all([
        getEvent(id),
        getSeats(id),
      ]);
      setEvent(eventData);
      setSeats(seatsData);
    } catch (err) {
      setError('Failed to load event data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
    
    // Auto-refresh seats every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleSeatClick = (seat) => {
    setSelectedSeat(seat);
  };

  const handleModalClose = () => {
    setSelectedSeat(null);
    fetchData();
  };

  const handleBookingSuccess = () => {
    fetchData();
  };

  const handleRefresh = (email) => {
    if (email) setUserEmail(email);
    fetchData();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" style={{ width: 48, height: 48 }}></div>
          <p className="text-slate-400">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="glass-card p-8 max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Event Not Found</h2>
          <p className="text-slate-400 mb-6">{error || 'This event does not exist or has been removed.'}</p>
          <Link
            to="/"
            className="inline-block px-6 py-2 rounded-lg btn-gradient text-white font-medium"
          >
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 py-8 px-4 md:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Back Link */}
        <Link 
          to="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Events
        </Link>

        {/* Event Header */}
        <div className="glass-card p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-2">{event.title}</h1>
              <div className="flex items-center gap-2 text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{formatDate(event.event_date)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-center px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <div className="text-xl font-bold text-emerald-400">{event.available_seats}</div>
                <div className="text-xs text-slate-500">Available</div>
              </div>
              <div className="text-center px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <div className="text-xl font-bold text-amber-400">{event.held_seats}</div>
                <div className="text-xs text-slate-500">Held</div>
              </div>
              <div className="text-center px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30">
                <div className="text-xl font-bold text-red-400">{event.booked_seats}</div>
                <div className="text-xs text-slate-500">Booked</div>
              </div>
            </div>
          </div>
        </div>

        {/* Seat Selection Instructions */}
        <p className="text-center text-slate-400 mb-6">
          Click on an available seat to begin the booking process
        </p>

        {/* Seat Grid */}
        <SeatGrid 
          seats={seats} 
          userEmail={userEmail} 
          onSeatClick={handleSeatClick} 
          loading={false}
        />

        {/* Booking Modal */}
        {selectedSeat && (
          <BookingModal
            seat={selectedSeat}
            userEmail={userEmail}
            holdData={selectedSeat.status === 'held' && selectedSeat.held_by === userEmail ? {
              expires_at: selectedSeat.hold_expires_at
            } : null}
            onClose={handleModalClose}
            onSuccess={handleBookingSuccess}
            onRefresh={handleRefresh}
          />
        )}
      </div>
    </div>
  );
}

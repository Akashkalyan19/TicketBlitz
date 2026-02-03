import { useState } from 'react';
import Timer from './Timer';
import { createHold, createBooking, processPayment, generateIdempotencyKey } from '../api/ticketApi';

const STEPS = {
  EMAIL: 'email',
  HOLD: 'hold',
  BOOKING: 'booking',
  PAYMENT: 'payment',
  SUCCESS: 'success',
  ERROR: 'error',
};

export default function BookingModal({ seat, userEmail, holdData, onClose, onSuccess, onRefresh }) {
  const [step, setStep] = useState(holdData ? STEPS.HOLD : STEPS.EMAIL);
  const [email, setEmail] = useState(userEmail || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [holdInfo, setHoldInfo] = useState(holdData);
  const [bookingInfo, setBookingInfo] = useState(null);

  const handleHold = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await createHold(seat.id, email);
      setHoldInfo({ 
        hold_id: result.hold_id, 
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() 
      });
      setStep(STEPS.HOLD);
      onRefresh && onRefresh(email);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to hold seat. It may no longer be available.');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await createBooking(holdInfo.hold_id);
      setBookingInfo(result);
      setStep(STEPS.PAYMENT);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create booking. Hold may have expired.');
      setStep(STEPS.ERROR);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    setError('');

    try {
      const idempotencyKey = generateIdempotencyKey();
      await processPayment(bookingInfo.booking_id, idempotencyKey);
      setStep(STEPS.SUCCESS);
      onSuccess && onSuccess();
    } catch (err) {
      // Payment can fail randomly (30% chance in backend), allow retry
      setError(err.response?.data?.error || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExpire = () => {
    setError('Your hold has expired. Please try again.');
    setStep(STEPS.ERROR);
    onRefresh && onRefresh(email);
  };

  const getRowLabel = (seatNumber) => {
    const row = Math.floor((seatNumber - 1) / 10);
    return 'ABCDEFGHIJ'[row];
  };

  const getColumnNumber = (seatNumber) => {
    return ((seatNumber - 1) % 10) + 1;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
      <div 
        className="glass-card w-full max-w-md p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Seat Info */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">
              {getRowLabel(seat.seat_number)}{getColumnNumber(seat.seat_number)}
            </span>
          </div>
          <h2 className="text-xl font-bold">Seat {getRowLabel(seat.seat_number)}{getColumnNumber(seat.seat_number)}</h2>
          <p className="text-slate-400 text-sm">Row {getRowLabel(seat.seat_number)} • Seat {getColumnNumber(seat.seat_number)}</p>
        </div>

        {/* Timer (if hold exists) */}
        {holdInfo && step !== STEPS.SUCCESS && step !== STEPS.ERROR && (
          <div className="flex justify-center mb-6">
            <Timer expiresAt={holdInfo.expires_at || seat.hold_expires_at} onExpire={handleExpire} />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Step Content */}
        {step === STEPS.EMAIL && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-600/50 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <button
              onClick={handleHold}
              disabled={loading}
              className="w-full py-3 rounded-lg btn-gradient text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <div className="spinner"></div> : 'Hold This Seat'}
            </button>
            <p className="text-xs text-slate-500 text-center">
              Your seat will be held for 10 minutes while you complete your booking.
            </p>
          </div>
        )}

        {step === STEPS.HOLD && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <p className="text-amber-400 text-sm">
                <strong>Seat held!</strong> Complete your booking before the timer expires.
              </p>
            </div>
            <button
              onClick={handleBooking}
              disabled={loading}
              className="w-full py-3 rounded-lg btn-gradient text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <div className="spinner"></div> : 'Confirm Booking'}
            </button>
          </div>
        )}

        {step === STEPS.PAYMENT && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
              <p className="text-indigo-400 text-sm">
                <strong>Booking confirmed!</strong> Booking ID: #{bookingInfo.booking_id}
              </p>
            </div>
            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full py-3 rounded-lg btn-gradient text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <div className="spinner"></div> : 'Pay Now'}
            </button>
            <p className="text-xs text-slate-500 text-center">
              Demo mode: Payment has a 70% success rate.
            </p>
          </div>
        )}

        {step === STEPS.SUCCESS && (
          <div className="space-y-4 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center">
              <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-emerald-400">Payment Successful!</h3>
            <p className="text-slate-400 text-sm">
              Your booking has been confirmed.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
            >
              Done
            </button>
          </div>
        )}

        {step === STEPS.ERROR && (
          <div className="space-y-4 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-red-400">Booking Failed . Please Try Again</h3>
            <p className="text-slate-400 text-sm">{error}</p>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

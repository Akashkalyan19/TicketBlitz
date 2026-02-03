export default function SeatButton({ seat, isUserHold, onClick, disabled }) {
  const getStatusStyles = () => {
    switch (seat.status) {
      case 'available':
        return 'bg-emerald-500/20 border-emerald-500 hover:bg-emerald-500/40 cursor-pointer';
      case 'held':
        return isUserHold 
          ? 'bg-amber-500/30 border-amber-500 seat-held cursor-pointer' 
          : 'bg-amber-500/20 border-amber-500 cursor-not-allowed opacity-60';
      case 'booked':
        return 'bg-red-500/20 border-red-500 cursor-not-allowed opacity-60';
      default:
        return 'bg-slate-500/20 border-slate-500';
    }
  };

  const getStatusIcon = () => {
    switch (seat.status) {
      case 'available':
        return null;
      case 'held':
        return (
          <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      case 'booked':
        return (
          <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const canClick = seat.status === 'available' || isUserHold;

  return (
    <button
      onClick={() => canClick && onClick(seat)}
      disabled={disabled || !canClick}
      className={`
        seat-button w-10 h-10 md:w-12 md:h-12 rounded-lg border-2 
        flex items-center justify-center text-xs font-medium
        transition-all duration-200
        ${getStatusStyles()}
        ${disabled ? 'opacity-50 cursor-wait' : ''}
      `}
      title={`Seat ${seat.seat_number} - ${seat.status}`}
    >
      {getStatusIcon() || seat.seat_number}
    </button>
  );
}

import SeatButton from './SeatButton';

export default function SeatGrid({ seats, userEmail, onSeatClick, loading }) {
  // Arrange seats in a 10x10 grid
  const rows = [];
  for (let i = 0; i < seats.length; i += 10) {
    rows.push(seats.slice(i, i + 10));
  }

  const rowLabels = 'ABCDEFGHIJ'.split('');

  return (
    <div className="glass-card p-6 md:p-8">
      {/* Screen Indicator */}
      <div className="mb-8 text-center">
        <div className="w-3/4 mx-auto h-2 bg-gradient-to-r from-indigo-500/20 via-indigo-500 to-indigo-500/20 rounded-full mb-2"></div>
        <span className="text-sm text-slate-400 uppercase tracking-widest">Screen</span>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-500/30 border border-emerald-500"></div>
          <span className="text-sm text-slate-400">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-500/30 border border-amber-500"></div>
          <span className="text-sm text-slate-400">Held</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500/30 border border-red-500"></div>
          <span className="text-sm text-slate-400">Booked</span>
        </div>
      </div>

      {/* Seat Grid */}
      <div className="flex flex-col items-center gap-2">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-2">
            {/* Row Label */}
            <span className="w-6 text-center text-sm font-medium text-slate-400">
              {rowLabels[rowIndex]}
            </span>
            
            {/* Seats */}
            <div className="flex gap-1 md:gap-2">
              {row.map((seat) => (
                <SeatButton
                  key={seat.id}
                  seat={seat}
                  isUserHold={seat.held_by === userEmail}
                  onClick={onSeatClick}
                  disabled={loading}
                />
              ))}
            </div>
            
            {/* Row Label (right side) */}
            <span className="w-6 text-center text-sm font-medium text-slate-400">
              {rowLabels[rowIndex]}
            </span>
          </div>
        ))}
        
        {/* Column Numbers */}
        <div className="flex items-center gap-2 mt-2">
          <span className="w-6"></span>
          <div className="flex gap-1 md:gap-2">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="w-10 h-6 md:w-12 text-center text-xs text-slate-500">
                {i + 1}
              </div>
            ))}
          </div>
          <span className="w-6"></span>
        </div>
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import "./booking-card.css";

const DEFAULT_SESSIONS = [
  { minutes: 15, label: "Quick", price: 40 },
  { minutes: 30, label: "Full", price: 80 },
  { minutes: 45, label: "Deep Dive", price: 120 },
];

const DEFAULT_SLOTS = [
  { dateLabel: "Fri, Mar 27th", timeLabel: "9:00 AM" },
  { dateLabel: "Fri, Mar 27th", timeLabel: "9:45 AM" },
];

function CalendarIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#28A880"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

/**
 * BookingCard
 * A React version of the static booking card from index.html.
 */
export default function BookingCard({
  sessions = DEFAULT_SESSIONS,
  quickSlots = DEFAULT_SLOTS,
  initialMinutes = 45,
  initialSlotIndex = 0,
  onViewAvailability,
  onBookNow,
}) {
  const defaultSession = useMemo(
    () => sessions.find((s) => s.minutes === initialMinutes) ?? sessions[0],
    [initialMinutes, sessions]
  );

  const [selectedMinutes, setSelectedMinutes] = useState(defaultSession.minutes);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(
    Math.min(Math.max(initialSlotIndex, 0), quickSlots.length - 1)
  );

  const activeSession =
    sessions.find((session) => session.minutes === selectedMinutes) ?? sessions[0];
  const selectedSlot = quickSlots[selectedSlotIndex];
  const hasSelectedSlot = Boolean(selectedSlot);

  const footerLine = hasSelectedSlot
    ? `${activeSession.label} · ${selectedSlot.dateLabel} · ${selectedSlot.timeLabel}`
    : `${activeSession.label} — select a time above`;

  const handleBookNow = () => {
    if (!hasSelectedSlot) return;
    onBookNow?.({
      session: activeSession,
      slot: selectedSlot,
    });
  };

  return (
    <article className="bk-card" aria-label="Booking card">
      <section className="bk-section">
        <p className="bk-label">How deep do you want to go?</p>
        <div className="bk-pills">
          {sessions.map((session) => {
            const isActive = session.minutes === selectedMinutes;
            return (
              <button
                key={session.minutes}
                type="button"
                className={`bk-pill${isActive ? " bk-pill--active" : ""}`}
                onClick={() => setSelectedMinutes(session.minutes)}
                aria-pressed={isActive}
              >
                {session.label}
                <span className="bk-pill-sub">{session.minutes} min</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="bk-section">
        <div className="bk-avail-hdr">
          <p className="bk-label bk-label--flush">Next availability</p>
          <button
            type="button"
            className="bk-view-cal"
            onClick={() => onViewAvailability?.()}
          >
            View other availability <ChevronRightIcon />
          </button>
        </div>

        <div className="bk-quick-slots">
          {quickSlots.map((slot, index) => {
            const isActive = selectedSlotIndex === index;
            return (
              <button
                key={`${slot.dateLabel}-${slot.timeLabel}-${index}`}
                type="button"
                className={`bk-slot${isActive ? " bk-slot--active" : ""}`}
                onClick={() => setSelectedSlotIndex(index)}
                aria-pressed={isActive}
              >
                <span className="bk-slot-main">{slot.dateLabel}</span>
                <span className="bk-slot-sub">{slot.timeLabel}</span>
              </button>
            );
          })}
        </div>
      </section>

      <footer className="bk-footer">
        <div className="bk-footer-left">
          <div className="bk-footer-icon">
            <CalendarIcon />
          </div>
          <div>
            <div className="bk-footer-price">Book for ${activeSession.price}</div>
            <div className="bk-footer-desc">{footerLine}</div>
          </div>
        </div>
        <button
          type="button"
          className="bk-book-btn"
          onClick={handleBookNow}
          disabled={!hasSelectedSlot}
        >
          Book Now
        </button>
      </footer>
    </article>
  );
}

'use client';

import { useMemo, useState } from 'react';
import styles from './BookingCard.module.css';

type Session = {
  minutes: number;
  label: string;
  price: number;
};

type QuickSlot = {
  dateLabel: string;
  timeLabel: string;
};

type BookingCardProps = {
  sessions?: Session[];
  quickSlots?: QuickSlot[];
  initialMinutes?: number;
  initialSlotIndex?: number;
  onViewAvailability?: () => void;
  onBookNow?: (payload: { session: Session; slot: QuickSlot }) => void;
};

const DEFAULT_SESSIONS: Session[] = [
  { minutes: 15, label: 'Quick', price: 40 },
  { minutes: 30, label: 'Full', price: 80 },
  { minutes: 45, label: 'Deep Dive', price: 120 },
];

const DEFAULT_SLOTS: QuickSlot[] = [
  { dateLabel: 'Fri, Mar 27th', timeLabel: '9:00 AM' },
  { dateLabel: 'Fri, Mar 27th', timeLabel: '9:45 AM' },
];

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#28A880" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export default function BookingCard({
  sessions = DEFAULT_SESSIONS,
  quickSlots = DEFAULT_SLOTS,
  initialMinutes = 45,
  initialSlotIndex = 0,
  onViewAvailability,
  onBookNow,
}: BookingCardProps) {
  const defaultSession = useMemo(
    () => sessions.find((s) => s.minutes === initialMinutes) ?? sessions[0],
    [initialMinutes, sessions]
  );

  const [selectedMinutes, setSelectedMinutes] = useState(defaultSession.minutes);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(
    Math.min(Math.max(initialSlotIndex, 0), Math.max(quickSlots.length - 1, 0))
  );

  const activeSession = sessions.find((s) => s.minutes === selectedMinutes) ?? sessions[0];
  const selectedSlot = quickSlots[selectedSlotIndex];
  const hasSelectedSlot = Boolean(selectedSlot);

  const footerLine = hasSelectedSlot
    ? `${activeSession.label} · ${selectedSlot.dateLabel} · ${selectedSlot.timeLabel}`
    : `${activeSession.label} — select a time above`;

  return (
    <article className={styles.card} aria-label="Booking card">
      <section className={styles.section}>
        <p className={styles.label}>How deep do you want to go?</p>
        <div className={styles.pills}>
          {sessions.map((session) => {
            const active = session.minutes === selectedMinutes;
            return (
              <button
                key={session.minutes}
                type="button"
                className={`${styles.pill} ${active ? styles.pillActive : ''}`}
                onClick={() => setSelectedMinutes(session.minutes)}
                aria-pressed={active}
              >
                {session.label}
                <span className={styles.pillSub}>{session.minutes} min</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.availHeader}>
          <p className={`${styles.label} ${styles.labelFlush}`}>Next availability</p>
          <button type="button" className={styles.viewCal} onClick={() => onViewAvailability?.()}>
            View other availability <ChevronRightIcon />
          </button>
        </div>

        <div className={styles.quickSlots}>
          {quickSlots.map((slot, idx) => {
            const active = idx === selectedSlotIndex;
            return (
              <button
                key={`${slot.dateLabel}-${slot.timeLabel}-${idx}`}
                type="button"
                className={`${styles.slot} ${active ? styles.slotActive : ''}`}
                onClick={() => setSelectedSlotIndex(idx)}
                aria-pressed={active}
              >
                <span className={styles.slotMain}>{slot.dateLabel}</span>
                <span className={styles.slotSub}>{slot.timeLabel}</span>
              </button>
            );
          })}
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerLeft}>
          <div className={styles.footerIcon}>
            <CalendarIcon />
          </div>
          <div>
            <div className={styles.footerPrice}>Book for ${activeSession.price}</div>
            <div className={styles.footerDesc}>{footerLine}</div>
          </div>
        </div>
        <button
          type="button"
          className={styles.bookBtn}
          disabled={!hasSelectedSlot}
          onClick={() => hasSelectedSlot && onBookNow?.({ session: activeSession, slot: selectedSlot })}
        >
          Book Now
        </button>
      </footer>
    </article>
  );
}

import BookingCard from "./BookingCard";

export default function BookingCardExample() {
  return (
    <div style={{ padding: "48px 16px", background: "#ddd5c4", minHeight: "100vh" }}>
      <BookingCard
        onViewAvailability={() => {
          // Hook this to your calendar modal/screen.
          // eslint-disable-next-line no-alert
          alert("Open full availability");
        }}
        onBookNow={({ session, slot }) => {
          // Hook this to your checkout flow.
          // eslint-disable-next-line no-alert
          alert(`Book ${session.label} at ${slot.dateLabel} ${slot.timeLabel}`);
        }}
      />
    </div>
  );
}

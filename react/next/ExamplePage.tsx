import BookingCard from './BookingCard';

export default function ExamplePage() {
  return (
    <main style={{ minHeight: '100vh', background: '#ddd5c4', padding: '48px 16px' }}>
      <BookingCard
        onViewAvailability={() => {
          // connect to your calendar screen/modal
          console.log('Open full availability');
        }}
        onBookNow={({ session, slot }) => {
          // connect to checkout/session creation
          console.log('Book:', session, slot);
        }}
      />
    </main>
  );
}

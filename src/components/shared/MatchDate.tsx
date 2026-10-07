export function MatchDate({ date }: { date: string }) {
  const value = new Date(date);
  const day = value.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  });
  const time = value.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return (
    <time dateTime={date}>
      {day.toUpperCase()} <span className="muted">· {time}</span>
    </time>
  );
}

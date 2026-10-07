export function HealthMeter({
  health,
  maxHealth,
}: {
  health: number;
  maxHealth: number;
}) {
  const emptyPercentage = 100 - (health / maxHealth) * 100;
  return (
    <div className="player-health" aria-live="polite">
      <span className="sr-only">
        Health: {health}/{maxHealth}
      </span>
      <div className="health-meter" aria-hidden="true">
        <div
          className="health-fill-clip"
          style={{ clipPath: `inset(0 ${emptyPercentage}% 0 0)` }}
        >
          <div className="health-fill" />
        </div>
        <span>
          {health} / {maxHealth}
        </span>
      </div>
    </div>
  );
}

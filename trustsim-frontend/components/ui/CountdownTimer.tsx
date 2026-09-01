"use client";
import React from "react";

interface CountdownTimerProps {
  endTime: Date | string;
  onEnd?: () => void;
  compact?: boolean;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ endTime, onEnd, compact = false }) => {
  const [timeLeft, setTimeLeft] = React.useState({ days: 0, hours: 0, minutes: 0, seconds: 0, ended: false });
  const [tick, setTick] = React.useState(false);

  React.useEffect(() => {
    const end = typeof endTime === "string" ? new Date(endTime) : endTime;

    const calculate = () => {
      const now = new Date().getTime();
      const distance = end.getTime() - now;
      if (distance <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, ended: true });
        onEnd?.();
        return;
      }
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds, ended: false });
      setTick((t) => !t);
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [endTime, onEnd]);

  if (timeLeft.ended) {
    return (
      <span style={{ color: "var(--text-muted)", fontSize: compact ? 12 : 14, fontWeight: 600 }}>
        Đã kết thúc
      </span>
    );
  }

  if (compact) {
    const parts = timeLeft.days > 0
      ? `${timeLeft.days}d ${pad(timeLeft.hours)}:${pad(timeLeft.minutes)}:${pad(timeLeft.seconds)}`
      : `${pad(timeLeft.hours)}:${pad(timeLeft.minutes)}:${pad(timeLeft.seconds)}`;

    const isUrgent = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes < 10;

    return (
      <span style={{
        fontVariantNumeric: "tabular-nums",
        fontWeight: 700,
        fontSize: 13,
        color: isUrgent ? "#f87171" : "var(--cyan-light)",
        animation: isUrgent ? "pulse-dot 1s ease infinite" : undefined,
      }}>
        ⏱ {parts}
      </span>
    );
  }

  const isUrgent = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes < 5;

  const boxes = timeLeft.days > 0
    ? [
        { num: timeLeft.days, label: "Ngày" },
        { num: timeLeft.hours, label: "Giờ" },
        { num: timeLeft.minutes, label: "Phút" },
        { num: timeLeft.seconds, label: "Giây" },
      ]
    : [
        { num: timeLeft.hours, label: "Giờ" },
        { num: timeLeft.minutes, label: "Phút" },
        { num: timeLeft.seconds, label: "Giây" },
      ];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {boxes.map((box, i) => (
        <React.Fragment key={box.label}>
          {i > 0 && (
            <span style={{
              color: isUrgent ? "#f87171" : "var(--cyan)",
              fontWeight: 800,
              fontSize: 18,
              lineHeight: 1,
              marginBottom: 14,
            }}>:</span>
          )}
          <div
            className="countdown-box"
            style={{ borderColor: isUrgent ? "rgba(239,68,68,0.4)" : undefined }}
          >
            <span
              className="countdown-num"
              style={{ color: isUrgent ? "#f87171" : undefined }}
              key={`${box.label}-${box.num}`}
            >
              {pad(box.num)}
            </span>
            <span className="countdown-label">{box.label}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default CountdownTimer;

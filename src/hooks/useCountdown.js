import { useEffect, useState } from "react";

export default function useCountdown() {
  // March 20, 2026 13:00:00 KST
  // Convert to UTC:
  // KST = UTC + 9
  // So UTC time = 2026-03-20T04:00:00Z

  const targetDate = new Date("2026-03-20T04:00:00Z").getTime();
  //const targetDate = new Date(Date.now() + 5000 ).getTime();


  const [timeLeft, setTimeLeft] = useState(getTimeRemaining());

  function getTimeRemaining() {
    const now = new Date().getTime();
    const difference = targetDate - now;

    if (difference <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: true,
      };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / (1000 * 60)) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      isExpired: false,
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeRemaining());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return timeLeft;
}

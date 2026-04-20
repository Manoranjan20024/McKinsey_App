import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SESSION_DURATION = 30 * 60; // 30 mins

export default function SessionTimer() {
  const [seconds, setSeconds] = useState(SESSION_DURATION);
  const [expired, setExpired] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (expired) navigate("/");
  }, [expired, navigate]);

  const mins = Math.floor(seconds / 60);
  const secs = String(seconds % 60).padStart(2, '0');
  const isLow = seconds < 5 * 60;

  return (
    <span className={`session-timer ${isLow ? "text-[#FCD34D] animate-pulse" : "text-white/70"} font-mono text-[12px] font-semibold tracking-wide`}>
      SESSION {mins}:{secs}
    </span>
  );
}

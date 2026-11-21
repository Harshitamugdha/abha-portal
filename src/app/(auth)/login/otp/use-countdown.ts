import { useEffect, useState } from "react";

export function useCountdown(seconds: number) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    if (left <= 0) {
      return;
    }
    const timer = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(timer);
  }, [left]);

  function restart() {
    setLeft(seconds);
  }

  return { left: left, restart: restart };
}

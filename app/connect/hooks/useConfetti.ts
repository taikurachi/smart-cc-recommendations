import { useRef } from "react";
import confetti from "canvas-confetti";

export const useConfetti = () => {
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);

  const fireConfetti = async (duration: number = 4000) => {
    if (!confettiCanvasRef.current) {
      await new Promise((resolve) => setTimeout(resolve, duration));
      return;
    }

    const myConfetti = confetti.create(confettiCanvasRef.current, {
      resize: true,
      useWorker: true,
    });

    const animationEnd = Date.now() + duration;
    const colors = ["#8b5cf6", "#10b981", "#3b82f6", "#f59e0b"];

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      // Left side confetti
      myConfetti({
        particleCount,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors,
      });
    }, 250);

    await new Promise((resolve) => setTimeout(resolve, duration));
    clearInterval(interval);
  };

  return { confettiCanvasRef, fireConfetti };
};


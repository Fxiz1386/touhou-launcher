import { useState, useEffect, useRef } from 'react';

interface UseGamepadOptions {
  onNavigateNext?: () => void;
  onNavigatePrev?: () => void;
  onSelect?: () => void;
  onBack?: () => void;
}

export function useGamepad(options: UseGamepadOptions = {}) {
  const [gamepadConnected, setGamepadConnected] = useState(false);
  const [gamepadName, setGamepadName] = useState<string>('');
  const lastButtonStateRef = useRef<Record<number, boolean>>({});
  const lastAxisTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleConnect = (e: GamepadEvent) => {
      setGamepadConnected(true);
      setGamepadName(e.gamepad.id);
    };

    const handleDisconnect = () => {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      const hasActive = Array.from(pads).some((p) => p !== null);
      setGamepadConnected(hasActive);
      if (!hasActive) setGamepadName('');
    };

    window.addEventListener('gamepadconnected', handleConnect);
    window.addEventListener('gamepaddisconnected', handleDisconnect);

    // Initial check
    if (typeof navigator !== 'undefined' && navigator.getGamepads) {
      const pads = navigator.getGamepads();
      const firstPad = Array.from(pads).find((p) => p !== null);
      if (firstPad) {
        setGamepadConnected(true);
        setGamepadName(firstPad.id);
      }
    }

    let rafId: number;
    const pollGamepad = () => {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      const pad = Array.from(pads).find((p) => p !== null);

      if (pad) {
        const now = Date.now();

        // Check D-Pad or Left Stick
        const axisX = pad.axes[0] || 0;
        const axisY = pad.axes[1] || 0;
        const dpadDown = pad.buttons[13]?.pressed;
        const dpadUp = pad.buttons[12]?.pressed;
        const dpadLeft = pad.buttons[14]?.pressed;
        const dpadRight = pad.buttons[15]?.pressed;

        if (now - lastAxisTimeRef.current > 200) {
          if (axisX > 0.5 || axisY > 0.5 || dpadDown || dpadRight) {
            options.onNavigateNext?.();
            lastAxisTimeRef.current = now;
          } else if (axisX < -0.5 || axisY < -0.5 || dpadUp || dpadLeft) {
            options.onNavigatePrev?.();
            lastAxisTimeRef.current = now;
          }
        }

        // Button 0 (A / Cross) -> Select
        if (pad.buttons[0]?.pressed && !lastButtonStateRef.current[0]) {
          options.onSelect?.();
        }
        // Button 1 (B / Circle) -> Back
        if (pad.buttons[1]?.pressed && !lastButtonStateRef.current[1]) {
          options.onBack?.();
        }

        // Store state
        pad.buttons.forEach((b, idx) => {
          lastButtonStateRef.current[idx] = b.pressed;
        });
      }

      rafId = requestAnimationFrame(pollGamepad);
    };

    rafId = requestAnimationFrame(pollGamepad);

    return () => {
      window.removeEventListener('gamepadconnected', handleConnect);
      window.removeEventListener('gamepaddisconnected', handleDisconnect);
      cancelAnimationFrame(rafId);
    };
  }, [options]);

  return { gamepadConnected, gamepadName };
}

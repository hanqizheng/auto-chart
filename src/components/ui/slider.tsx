"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
}

export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  className,
}: SliderProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const sliderRef = React.useRef<HTMLDivElement>(null);

  const percentage = ((value[0] - min) / (max - min)) * 100;

  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;

      e.preventDefault();
      setIsDragging(true);

      const rect = sliderRef.current?.getBoundingClientRect();
      if (!rect) return;

      const clickX = e.clientX - rect.left;
      const clickPercentage = clickX / rect.width;
      const newValue = min + (max - min) * clickPercentage;
      const steppedValue = Math.round(newValue / step) * step;
      const clampedValue = Math.max(min, Math.min(max, steppedValue));

      onValueChange([clampedValue]);
    },
    [disabled, min, max, step, onValueChange]
  );

  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = sliderRef.current?.getBoundingClientRect();
      if (!rect) return;

      const clickX = e.clientX - rect.left;
      const clickPercentage = Math.max(0, Math.min(1, clickX / rect.width));
      const newValue = min + (max - min) * clickPercentage;
      const steppedValue = Math.round(newValue / step) * step;
      const clampedValue = Math.max(min, Math.min(max, steppedValue));

      onValueChange([clampedValue]);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, min, max, step, onValueChange]);

  return (
    <div
      ref={sliderRef}
      className={cn(
        "relative flex h-5 w-full cursor-pointer touch-none items-center select-none",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
      onMouseDown={handleMouseDown}
    >
      {/* Track */}
      <div className="bg-secondary relative h-1.5 w-full grow overflow-hidden rounded-full">
        {/* Progress */}
        <div
          className="bg-primary absolute h-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Thumb */}
      <div
        className={cn(
          "border-primary bg-background absolute h-4 w-4 rounded-full border-2 shadow transition-colors",
          "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
          disabled ? "cursor-not-allowed" : "cursor-grab",
          isDragging && "scale-110 cursor-grabbing"
        )}
        style={{ left: `${percentage}%`, transform: "translateX(-50%)" }}
      />
    </div>
  );
}

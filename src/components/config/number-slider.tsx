/**
 * 数值滑块组件
 * 支持范围控制和格式化显示
 */

import { FC } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { NumberRange } from "@/types/chart-config";

interface NumberSliderProps {
  /** 标签文本 */
  label: string;
  /** 当前值 */
  value: number;
  /** 数值范围 */
  range: NumberRange;
  /** 单位 */
  unit?: string;
  /** 格式化函数 */
  formatter?: (value: number) => number;
  /** 变更回调 */
  onChange: (value: number) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 额外的样式类名 */
  className?: string;
}

export const NumberSlider: FC<NumberSliderProps> = ({
  label,
  value,
  range,
  unit = "",
  formatter,
  onChange,
  disabled = false,
  className = "",
}) => {
  const handleSliderChange = (values: number[]) => {
    onChange(values[0]);
  };

  const displayValue = formatter ? formatter(value) : value;
  const displayUnit = unit;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <Label className="text-muted-foreground text-sm">{label}</Label>
        <span className="text-muted-foreground text-xs">
          {displayValue}
          {displayUnit}
        </span>
      </div>
      <Slider
        value={[value]}
        min={range.min}
        max={range.max}
        step={range.step}
        onValueChange={handleSliderChange}
        disabled={disabled}
        className="w-full"
      />
    </div>
  );
};

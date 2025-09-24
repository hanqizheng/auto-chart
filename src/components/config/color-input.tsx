/**
 * 颜色输入组件
 * 支持颜色选择器和文本输入
 */

import { FC, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizeHexColor } from "@/lib/colors";

const HEX_INPUT_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

interface ColorInputProps {
  /** 标签文本 */
  label: string;
  /** 当前颜色值 */
  value: string;
  /** 变更回调 */
  onChange: (color: string) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 额外的样式类名 */
  className?: string;
}

export const ColorInput: FC<ColorInputProps> = ({
  label,
  value,
  onChange,
  disabled = false,
  className = "",
}) => {
  const [hexInput, setHexInput] = useState(value);
  const [hexError, setHexError] = useState<string | null>(null);

  useEffect(() => {
    setHexInput(value);
    setHexError(null);
  }, [value]);

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setHexInput(newColor);
    setHexError(null);
    onChange(newColor);
  };

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setHexInput(inputValue);
    setHexError(null);

    if (HEX_INPUT_PATTERN.test(inputValue.trim())) {
      onChange(normalizeHexColor(inputValue));
    }
  };

  const handleHexInputBlur = () => {
    if (!HEX_INPUT_PATTERN.test(hexInput.trim())) {
      setHexError("Invalid hex color");
    } else {
      onChange(normalizeHexColor(hexInput));
    }
  };

  const handleHexInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleHexInputBlur();
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <input
        type="color"
        value={value}
        onChange={handleColorPickerChange}
        disabled={disabled}
        className="border-border h-8 w-8 cursor-pointer rounded border disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={`Select ${label} color`}
      />
      <Label className="flex-1 text-sm">{label}</Label>
      <div className="flex flex-col">
        <Input
          value={hexInput}
          onChange={handleHexInputChange}
          onBlur={handleHexInputBlur}
          onKeyDown={handleHexInputKeyDown}
          disabled={disabled}
          className="w-20 text-xs"
          pattern={HEX_INPUT_PATTERN.source}
          placeholder="#000000"
        />
        {hexError && <span className="text-xs text-red-500">{hexError}</span>}
      </div>
    </div>
  );
};

/**
 * 选择下拉组件
 * 通用的选择控件
 */

import { FC } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SelectOption } from "@/types/chart-config";

interface SelectDropdownProps {
  /** 标签文本 */
  label: string;
  /** 当前值 */
  value: string | number;
  /** 选项列表 */
  options: readonly SelectOption[];
  /** 占位符文本 */
  placeholder?: string;
  /** 变更回调 */
  onChange: (value: string | number) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 额外的样式类名 */
  className?: string;
}

export const SelectDropdown: FC<SelectDropdownProps> = ({
  label,
  value,
  options,
  placeholder = "Select an option",
  onChange,
  disabled = false,
  className = "",
}) => {
  const handleValueChange = (newValue: string) => {
    // 尝试转换为数字，如果失败则保持字符串
    const numericValue = Number(newValue);
    const finalValue =
      !isNaN(numericValue) && numericValue.toString() === newValue ? numericValue : newValue;
    onChange(finalValue);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-sm font-medium">{label}</Label>
      <Select value={String(value)} onValueChange={handleValueChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={String(option.value)} value={String(option.value)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

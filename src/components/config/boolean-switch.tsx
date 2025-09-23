/**
 * 布尔开关组件
 * 带标签的开关控件
 */

import { FC } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface BooleanSwitchProps {
  /** 唯一标识符 */
  id: string;
  /** 标签文本 */
  label: string;
  /** 当前值 */
  value: boolean;
  /** 变更回调 */
  onChange: (value: boolean) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 额外的样式类名 */
  className?: string;
}

export const BooleanSwitch: FC<BooleanSwitchProps> = ({
  id,
  label,
  value,
  onChange,
  disabled = false,
  className = "",
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Switch id={id} checked={value} onCheckedChange={onChange} disabled={disabled} />
      <Label htmlFor={id} className="text-muted-foreground cursor-pointer text-sm">
        {label}
      </Label>
    </div>
  );
};

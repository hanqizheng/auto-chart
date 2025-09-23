/**
 * 动态配置UI渲染器
 * 基于JSON配置描述自动生成UI组件
 */

import { FC } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ColorInput, NumberSlider, BooleanSwitch, SelectDropdown } from "./index";
import {
  ChartConfigSchema,
  UnifiedChartConfig,
  ConfigChangeEvent,
  ColorConfigItem,
  OptionConfigItem,
} from "@/types/chart-config";
import { CHART_CONFIG_TYPES } from "@/constants/chart-config";

interface DynamicConfigRendererProps {
  /** 配置描述 */
  schema: ChartConfigSchema;
  /** 当前配置值 */
  config: UnifiedChartConfig;
  /** 配置变更回调 */
  onChange: (event: ConfigChangeEvent) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 额外的样式类名 */
  className?: string;
}

export const DynamicConfigRenderer: FC<DynamicConfigRendererProps> = ({
  schema,
  config,
  onChange,
  disabled = false,
  className = "",
}) => {
  /**
   * 渲染颜色配置项
   */
  const renderColorConfig = (item: ColorConfigItem) => {
    if (item.isArray) {
      // 系列颜色配置
      return (
        <div key={item.key} className="space-y-2">
          <Label className="text-sm font-medium">{item.label}</Label>
          <div className="max-h-32 space-y-2 overflow-y-auto pr-2">
            {config.colors.series.map((color, index) => {
              const seriesInfo = config.seriesKeys[index];
              return (
                <ColorInput
                  key={`${item.key}-${index}`}
                  label={seriesInfo?.label || `Series ${index + 1}`}
                  value={color}
                  onChange={newColor =>
                    onChange({
                      type: "color",
                      key: item.key,
                      value: newColor,
                      index,
                    })
                  }
                  disabled={disabled}
                />
              );
            })}
          </div>
        </div>
      );
    } else {
      // 单个颜色配置
      const currentValue = (config.colors as any)[item.key] || "#000000";
      return (
        <ColorInput
          key={item.key}
          label={item.label}
          value={currentValue}
          onChange={newColor =>
            onChange({
              type: "color",
              key: item.key,
              value: newColor,
            })
          }
          disabled={disabled}
        />
      );
    }
  };

  /**
   * 渲染选项配置项
   */
  const renderOptionConfig = (item: OptionConfigItem) => {
    const currentValue = (config.options as any)[item.key] ?? item.defaultValue;

    // 检查依赖条件
    if (item.dependsOn) {
      const dependentValue = (config.options as any)[item.dependsOn];
      if (!dependentValue) {
        return null; // 不渲染这个配置项
      }
    }

    const commonProps = {
      disabled,
    };

    switch (item.type) {
      case CHART_CONFIG_TYPES.BOOLEAN:
        return (
          <BooleanSwitch
            key={item.key}
            {...commonProps}
            id={item.key}
            label={item.label}
            value={currentValue}
            onChange={newValue =>
              onChange({
                type: "option",
                key: item.key,
                value: newValue,
              })
            }
          />
        );

      case CHART_CONFIG_TYPES.NUMBER:
        if (!item.range) {
          console.warn(`Number config item ${item.key} missing range`);
          return null;
        }
        return (
          <NumberSlider
            key={item.key}
            {...commonProps}
            label={item.label}
            value={currentValue}
            range={item.range}
            unit={item.unit}
            formatter={item.formatter}
            onChange={newValue =>
              onChange({
                type: "option",
                key: item.key,
                value: newValue,
              })
            }
          />
        );

      case CHART_CONFIG_TYPES.SELECT:
        if (!item.options) {
          console.warn(`Select config item ${item.key} missing options`);
          return null;
        }
        return (
          <SelectDropdown
            key={item.key}
            {...commonProps}
            label={item.label}
            value={currentValue}
            options={item.options}
            onChange={newValue =>
              onChange({
                type: "option",
                key: item.key,
                value: newValue,
              })
            }
          />
        );

      default:
        console.warn(`Unknown config type: ${item.type}`);
        return null;
    }
  };

  const hasColorConfigs = schema.colors.length > 0;
  const hasOptionConfigs = schema.options.length > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 颜色配置区域 */}
      {hasColorConfigs && (
        <Card className="bg-muted/20">
          <CardContent className="space-y-4 p-4">
            <Label className="text-sm font-medium">Colors</Label>
            <div className="space-y-3">{schema.colors.map(renderColorConfig)}</div>
          </CardContent>
        </Card>
      )}

      {/* 选项配置区域 */}
      {hasOptionConfigs && (
        <Card className="bg-muted/20">
          <CardContent className="space-y-4 p-4">
            <Label className="text-sm font-medium">Options</Label>
            <div className="space-y-3">{schema.options.map(renderOptionConfig)}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

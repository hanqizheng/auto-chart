/**
 * 动态配置UI渲染器
 * 基于JSON配置描述自动生成UI组件
 */

import { FC, useMemo } from "react";
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
   * 渲染颜色配置项 - 简化版本，只支持数组配置
   */
  const renderColorConfig = (item: ColorConfigItem) => {

    if (item.isArray) {
      // 系列颜色配置 - 统一处理
      const colors = item.key === "seriesStroke" ? config.colors.seriesStroke || [] : config.colors.series;

      return (
        <div key={item.key} className="space-y-2">
          <Label className="text-sm font-medium">{item.label}</Label>
          <div className="max-h-32 space-y-2 overflow-y-auto pr-2">
            {colors.map((color, index) => {
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
      // 单个颜色配置（网格、背景等）
      const currentValue = (config.colors as any)[item.key] || "#000000";

      return (
        <ColorInput
          key={item.key}
          label={item.label}
          value={currentValue}
          onChange={newColor => {
            onChange({
              type: "color",
              key: item.key,
              value: newColor,
            });
          }}
          disabled={disabled}
        />
      );
    }
  };

  /**
   * 渲染选项配置项
   */
  const renderOptionConfig = (item: OptionConfigItem) => {
    const currentValue = (config.options as Record<string, unknown>)[item.key] ?? item.defaultValue;

    // 检查依赖条件
    if (item.dependsOn) {
      const dependentValue = (config.options as Record<string, unknown>)[item.dependsOn];
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
        return null;
    }
  };

  const hasColorConfigs = schema.colors.length > 0;
  const hasOptionConfigs = schema.options.length > 0;

  // 按系列分组颜色配置
  const groupedColorConfigs = useMemo(() => {
    const groups: Record<string, any[]> = {};
    const ungrouped: any[] = [];

    schema.colors.forEach(item => {
      if (item.category === "series" && item.seriesKey) {
        const seriesKey = item.seriesKey;
        if (!groups[seriesKey]) {
          groups[seriesKey] = [];
        }
        groups[seriesKey].push(item);
      } else {
        ungrouped.push(item);
      }
    });

    return { groups, ungrouped };
  }, [schema.colors]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 颜色配置区域 */}
      {hasColorConfigs && (
        <Card className="bg-muted/20">
          <CardContent className="space-y-4 p-4">
            <Label className="text-sm font-medium">Colors</Label>
            <div className="space-y-4">
              {/* 渲染分组的系列配置 */}
              {Object.entries(groupedColorConfigs.groups).map(([seriesKey, configs]) => (
                <div key={seriesKey} className="rounded-lg border bg-background/50 p-3">
                  <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                    {configs[0]?.seriesIndex !== undefined && config.seriesKeys[configs[0].seriesIndex]
                      ? config.seriesKeys[configs[0].seriesIndex].label || `Series ${configs[0].seriesIndex + 1}`
                      : seriesKey}
                  </Label>
                  <div className="space-y-2">
                    {configs.map(renderColorConfig)}
                  </div>
                </div>
              ))}

              {/* 渲染未分组的配置（如Grid等） */}
              {groupedColorConfigs.ungrouped.length > 0 && (
                <div className="space-y-2">
                  {groupedColorConfigs.ungrouped.map(renderColorConfig)}
                </div>
              )}
            </div>
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

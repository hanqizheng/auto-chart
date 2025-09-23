// Chart Generator - 图表生成器
// 负责基于真实数据生成图表配置，无Mock逻辑

import { ChartType } from "@/types/chart";
import { CHART_TYPES } from "@/constants/chart";
import {
  ChartIntent,
  UnifiedDataStructure,
  ChartConfig,
  ChartGenerationResult,
  DataRow,
  DataValue,
  AIChartError,
} from "./types";

const { PIE, BAR, LINE, AREA, RADAR, RADIAL } = CHART_TYPES;

/**
 * 图表生成器接口
 */
export interface IChartGenerator {
  /** 生成图表 */
  generateChart(intent: ChartIntent, data: UnifiedDataStructure): Promise<ChartGenerationResult>;

  /** 构建图表配置 */
  buildConfiguration(
    chartType: ChartType,
    data: UnifiedDataStructure,
    intent: ChartIntent
  ): ChartConfig;
}

/**
 * 图表生成器实现
 */
export class ChartGenerator implements IChartGenerator {
  private readonly DEFAULT_COLORS = [
    "#8b5cf6", // Purple
    "#06b6d4", // Cyan
    "#f59e0b", // Amber
    "#ef4444", // Red
    "#10b981", // Emerald
    "#22c55e", // Green
    "#f97316", // Orange
    "#ec4899", // Pink
  ];

  private readonly DEFAULT_DIMENSIONS = {
    width: 800,
    height: 400,
  };

  /**
   * 生成完整的图表结果
   */
  async generateChart(
    intent: ChartIntent,
    data: UnifiedDataStructure
  ): Promise<ChartGenerationResult> {
    const startTime = Date.now();

    try {
      // 验证数据完整性
      this.validateDataForChart(data, intent);

      // 预处理数据
      const processedData = this.preprocessData(data, intent);

      // 构建图表配置
      const config = this.buildConfiguration(intent.chartType, data, intent);

      // 生成洞察
      const insights = await this.generateInsights(processedData, intent);

      const needsCircularTransform = intent.chartType === PIE || intent.chartType === RADIAL;

      console.log("🐛🎨 [ChartGenerator] 数据转换判断:", {
        chartType: intent.chartType,
        PIE_constant: PIE,
        RADIAL_constant: RADIAL,
        isPie: intent.chartType === PIE,
        isRadial: intent.chartType === RADIAL,
        needsCircularTransform,
      });

      const resultData = needsCircularTransform
        ? this.normalizePieResult(processedData, intent)
        : processedData;

      console.log("🐛🎨 [ChartGenerator] 数据转换结果:", {
        originalDataLength: processedData.length,
        originalDataSample: processedData.slice(0, 1),
        transformedDataLength: resultData.length,
        transformedDataSample: resultData.slice(0, 1),
        wasTransformed: needsCircularTransform,
      });

      const processingTime = Date.now() - startTime;

      const result: ChartGenerationResult = {
        success: true,
        chartType: intent.chartType,
        data: resultData,
        config,
        title: intent.suggestions.title,
        description: intent.suggestions.description,
        insights,
        metadata: {
          generatedAt: new Date(),
          dataSource: data.metadata.source,
          processingTime,
          confidence: intent.confidence,
        },
      };

      console.log("✅ [ChartGenerator] 图表生成成功:", {
        chartType: result.chartType,
        dataLength: result.data.length,
        title: result.title,
        processingTime: result.metadata.processingTime,
      });

      return result;
    } catch (error) {
      throw new AIChartError("chart_generation", "UNKNOWN_ERROR", "图表生成过程失败", {
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  /**
   * 构建图表配置
   */
  buildConfiguration(
    chartType: ChartType,
    data: UnifiedDataStructure,
    intent: ChartIntent
  ): ChartConfig {
    const stats = data.metadata.statistics;
    const mapping = intent.visualMapping;

    // 基础配置
    const config: ChartConfig = {
      colors: this.generateColorScheme(stats.numericFields.length),
      dimensions: this.calculateDimensions(data.data.length, chartType),
      axes: {
        xAxis: {
          label: this.formatAxisLabel(mapping.xAxis),
          type: this.inferAxisType(mapping.xAxis, data),
        },
        yAxis: {
          label: this.formatAxisLabel(mapping.yAxis[0] || "Value"),
          type: "value",
        },
      },
      legend: {
        show:
          mapping.yAxis.length > 1 ||
          chartType === PIE ||
          chartType === RADIAL ||
          chartType === RADAR,
        position: this.determineLegendPosition(chartType, data.data.length),
      },
      responsive: true,
    };

    // 图表特定配置
    switch (chartType) {
      case PIE:
        config.legend.position = "right";
        break;

      case RADIAL:
        config.legend.position = "right";
        config.axes = {
          xAxis: {
            label: this.formatAxisLabel(mapping.xAxis || "Category"),
            type: "category",
          },
          yAxis: {
            label: this.formatAxisLabel(mapping.yAxis[0] || "Value"),
            type: "value",
            min: 0,
          },
        };
        break;

      case LINE:
        // 折线图可能需要时间轴特殊处理
        if (stats.dateFields.includes(mapping.xAxis)) {
          config.axes.xAxis.type = "time";
        }
        break;

      case AREA:
        // 面积图通常使用堆叠模式
        config.axes.yAxis.min = 0;
        break;

      case RADAR:
        config.axes = {
          xAxis: {
            label: this.formatAxisLabel(mapping.xAxis || "Category"),
            type: "category",
          },
          yAxis: {
            label: this.formatAxisLabel(mapping.yAxis[0] || "Value"),
            type: "value",
            min: 0,
          },
        };
        break;
    }

    // 数值范围计算
    if (mapping.yAxis.length > 0) {
      const yAxisRange = this.calculateYAxisRange(data.data, mapping.yAxis);
      config.axes.yAxis.min = yAxisRange.min;
      config.axes.yAxis.max = yAxisRange.max;
    }

    return config;
  }

  /**
   * 验证数据是否适合生成图表
   */
  private validateDataForChart(data: UnifiedDataStructure, intent: ChartIntent): void {
    if (!data.isValid) {
      throw new AIChartError(
        "chart_generation",
        "INVALID_REQUEST",
        `数据质量问题：${data.validationErrors.join(", ")}`
      );
    }

    if (data.data.length === 0) {
      throw new AIChartError("chart_generation", "INSUFFICIENT_DATA", "没有可用的数据记录");
    }

    // 检查必需字段
    for (const requiredField of intent.requiredFields) {
      const hasField = data.schema.fields.some(f => f.name === requiredField);
      if (!hasField) {
        throw new AIChartError(
          "chart_generation",
          "INVALID_REQUEST",
          `缺少必需的数据字段：${requiredField}`
        );
      }
    }

    // 图表特定验证
    this.validateChartSpecificRequirements(intent.chartType, data);
  }

  /**
   * 图表特定验证
   */
  private validateChartSpecificRequirements(
    chartType: ChartType,
    data: UnifiedDataStructure
  ): void {
    const stats = data.metadata.statistics;

    switch (chartType) {
      case PIE:
        if (stats.numericFields.length === 0) {
          throw new AIChartError("chart_generation", "INVALID_REQUEST", "饼图需要至少一个数值字段");
        }
        if (data.data.length > 12) {
          throw new AIChartError(
            "chart_generation",
            "INVALID_REQUEST",
            "饼图类别过多（超过12个），建议使用柱状图"
          );
        }
        break;

      case RADIAL:
        if (stats.numericFields.length === 0) {
          throw new AIChartError("chart_generation", "INVALID_REQUEST", "径向图需要一个数值字段");
        }
        if (stats.categoricalFields.length === 0) {
          throw new AIChartError(
            "chart_generation",
            "INVALID_REQUEST",
            "径向图需要分类字段作为角度坐标"
          );
        }
        break;

      case LINE:
        if (stats.numericFields.length === 0) {
          throw new AIChartError(
            "chart_generation",
            "INVALID_REQUEST",
            "折线图需要至少一个数值字段"
          );
        }
        if (data.data.length < 2) {
          throw new AIChartError(
            "chart_generation",
            "INSUFFICIENT_DATA",
            "折线图需要至少2个数据点"
          );
        }
        break;

      case BAR:
      case AREA:
        if (stats.numericFields.length === 0) {
          throw new AIChartError(
            "chart_generation",
            "INVALID_REQUEST",
            `${chartType}图需要至少一个数值字段`
          );
        }
        break;

      case RADAR:
        if (stats.numericFields.length < 2) {
          throw new AIChartError(
            "chart_generation",
            "INVALID_REQUEST",
            "雷达图需要至少两个数值字段用于比较"
          );
        }
        if (stats.categoricalFields.length === 0) {
          throw new AIChartError(
            "chart_generation",
            "INVALID_REQUEST",
            "雷达图需要分类字段作为轴标签"
          );
        }
        break;
    }
  }

  /**
   * 预处理数据
   */
  private preprocessData(data: UnifiedDataStructure, intent: ChartIntent): DataRow[] {
    const mapping = intent.visualMapping;

    const processedData = data.data.map((row, index) => {
      const processed: DataRow = {};

      // 复制X轴字段
      if (mapping.xAxis && row[mapping.xAxis] !== undefined) {
        processed[mapping.xAxis] = this.formatValue(row[mapping.xAxis], mapping.xAxis, data);
      }

      // 复制Y轴字段
      mapping.yAxis.forEach(yField => {
        if (row[yField] !== undefined) {
          const value = this.parseNumericValue(row[yField]);
          processed[yField] = value;
        }
      });

      // 复制颜色分组字段
      if (mapping.colorBy && row[mapping.colorBy] !== undefined) {
        processed[mapping.colorBy] = row[mapping.colorBy];
      }

      return processed;
    });

    // 数据清理：移除无效记录
    const cleanedData = processedData.filter((row, index) => {
      // 至少要有X轴值
      const hasXValue =
        mapping.xAxis && row[mapping.xAxis] !== null && row[mapping.xAxis] !== undefined;

      // 至少要有一个有效的Y轴值
      const hasYValue = mapping.yAxis.some(
        yField => typeof row[yField] === "number" && !isNaN(row[yField])
      );

      return hasXValue && hasYValue;
    });

    console.log("✅ [ChartGenerator] 数据预处理完成:", {
      原始数据: data.data.length,
      清理后数据: cleanedData.length,
      丢弃行数: processedData.length - cleanedData.length,
    });

    return cleanedData;
  }

  private normalizePieResult(data: DataRow[], intent: ChartIntent): DataRow[] {
    const xField = intent.visualMapping.xAxis;
    const yField = intent.visualMapping.yAxis[0];

    if (!xField || !yField) {
      return data;
    }

    return data
      .map(row => {
        const name = row[xField];
        const rawValue = row[yField];
        const value =
          typeof rawValue === "number"
            ? rawValue
            : typeof rawValue === "string"
              ? this.parseNumericValue(rawValue)
              : null;

        if (name == null || value == null || isNaN(value)) {
          return null;
        }

        return {
          name: String(name),
          value,
        } as DataRow;
      })
      .filter((row): row is DataRow => row !== null);
  }

  /**
   * 生成数据洞察
   */
  private async generateInsights(data: DataRow[], intent: ChartIntent): Promise<string[]> {
    const insights = [...intent.suggestions.insights];

    try {
      const mapping = intent.visualMapping;

      // 基础统计洞察
      if (mapping.yAxis.length > 0) {
        const stats = this.calculateBasicStatistics(data, mapping.yAxis[0]);
        insights.push(`数据范围：${stats.min.toLocaleString()} - ${stats.max.toLocaleString()}`);
        insights.push(`平均值：${stats.average.toLocaleString()}`);

        if (intent.chartType === LINE && data.length > 1) {
          const trend = this.calculateTrend(data, mapping.yAxis[0]);
          insights.push(`总体趋势：${trend > 0 ? "上升" : trend < 0 ? "下降" : "平稳"}`);
        }
      }

      // 图表特定洞察
      switch (intent.chartType) {
        case PIE:
        case RADIAL:
          const total = data.reduce((sum, item) => {
            const value = this.parseNumericValue(item[mapping.yAxis[0]]);
            return sum + (value || 0);
          }, 0);

          if (total > 0) {
            const maxItem = data.reduce((max, item) => {
              const maxValue = this.parseNumericValue(max[mapping.yAxis[0]]) || 0;
              const itemValue = this.parseNumericValue(item[mapping.yAxis[0]]) || 0;
              return itemValue > maxValue ? item : max;
            });
            const maxValue = this.parseNumericValue(maxItem[mapping.yAxis[0]]) || 0;
            const percentage = ((maxValue / total) * 100).toFixed(1);
            insights.push(`最大占比：${maxItem[mapping.xAxis]} (${percentage}%)`);
          }
          break;

        case BAR:
          const sortedData = [...data].sort((a, b) => {
            const aValue = this.parseNumericValue(a[mapping.yAxis[0]]) || 0;
            const bValue = this.parseNumericValue(b[mapping.yAxis[0]]) || 0;
            return bValue - aValue;
          });
          if (sortedData.length >= 2) {
            insights.push(
              `排名前二：${sortedData[0][mapping.xAxis]}、${sortedData[1][mapping.xAxis]}`
            );
          }
          break;

        case RADAR:
          const metricCount = mapping.yAxis.length;
          insights.push(`雷达图展示 ${metricCount} 个指标的全景对比`);
          break;
      }

      // 数据质量洞察
      const nullCount = data.reduce(
        (count, row) => count + mapping.yAxis.filter(field => row[field] == null).length,
        0
      );

      if (nullCount > 0) {
        insights.push(`发现 ${nullCount} 个缺失数值，已自动处理`);
      }
    } catch (error) {
      insights.push("数据分析完成，图表已生成");
    }

    return insights.slice(0, 6); // 限制洞察数量
  }

  // 辅助方法

  private generateColorScheme(seriesCount: number): string[] {
    const colors = [...this.DEFAULT_COLORS];

    // 如果系列数超过默认颜色数，生成更多颜色
    while (colors.length < seriesCount) {
      colors.push(...this.DEFAULT_COLORS);
    }

    return colors.slice(0, Math.max(seriesCount, 1));
  }

  private calculateDimensions(
    dataCount: number,
    chartType: ChartType
  ): { width: number; height: number } {
    let { width, height } = this.DEFAULT_DIMENSIONS;

    // 根据数据量和图表类型调整尺寸
    if (chartType === BAR && dataCount > 10) {
      width = Math.min(1200, 600 + dataCount * 30);
    }

    if (chartType === PIE || chartType === RADIAL) {
      width = Math.min(width, height + 200); // 饼/径向图通常不需要很宽
    }

    return { width, height };
  }

  private formatAxisLabel(fieldName: string): string {
    // 基础格式化，移除下划线，首字母大写
    return fieldName.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  }

  private inferAxisType(
    fieldName: string,
    data: UnifiedDataStructure
  ): "category" | "time" | "value" {
    const field = data.schema.fields.find(f => f.name === fieldName);

    if (!field) return "category";

    switch (field.type) {
      case "date":
        return "time";
      case "number":
        return "value";
      default:
        return "category";
    }
  }

  private determineLegendPosition(
    chartType: ChartType,
    dataCount: number
  ): "top" | "bottom" | "left" | "right" {
    if (chartType === PIE || chartType === RADIAL) return "right";
    if (chartType === RADAR) return "top";
    if (dataCount > 8) return "top";
    return "bottom";
  }

  private calculateYAxisRange(data: DataRow[], yFields: string[]): { min: number; max: number } {
    let min = Infinity;
    let max = -Infinity;

    data.forEach(row => {
      yFields.forEach(field => {
        const value = this.parseNumericValue(row[field]);
        if (typeof value === "number" && !isNaN(value)) {
          min = Math.min(min, value);
          max = Math.max(max, value);
        }
      });
    });

    // 如果没有有效数值，使用默认值
    if (min === Infinity || max === -Infinity) {
      return { min: 0, max: 100 };
    }

    // 添加一些边距
    const range = max - min;
    const padding = range * 0.1;

    return {
      min: Math.max(0, min - padding), // 通常不显示负值
      max: max + padding,
    };
  }

  private formatValue(value: DataValue, fieldName: string, data: UnifiedDataStructure): DataValue {
    const field = data.schema.fields.find(f => f.name === fieldName);

    if (!field) return value;

    switch (field.type) {
      case "date":
        if (value instanceof Date) return value.toISOString().split("T")[0];
        if (typeof value === "string") {
          const date = new Date(value);
          return isNaN(date.getTime()) ? value : date.toISOString().split("T")[0];
        }
        return value;

      case "number":
        return this.parseNumericValue(value);

      default:
        return String(value || "").trim();
    }
  }

  private parseNumericValue(value: DataValue): number | null {
    if (typeof value === "number") {
      return isNaN(value) ? null : value;
    }

    if (typeof value === "string") {
      // 清理字符串：移除货币符号、千分位分隔符等
      const cleaned = value.replace(/[,$%¥€£]/g, "").trim();
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? null : parsed;
    }

    return null;
  }

  private calculateBasicStatistics(
    data: DataRow[],
    field: string
  ): {
    min: number;
    max: number;
    average: number;
    total: number;
  } {
    const values = data
      .map(row => this.parseNumericValue(row[field]))
      .filter((v): v is number => v !== null);

    if (values.length === 0) {
      return { min: 0, max: 0, average: 0, total: 0 };
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const total = values.reduce((sum, v) => sum + v, 0);
    const average = total / values.length;

    return { min, max, average, total };
  }

  private calculateTrend(data: DataRow[], field: string): number {
    if (data.length < 2) return 0;

    const firstValue = this.parseNumericValue(data[0][field]) || 0;
    const lastValue = this.parseNumericValue(data[data.length - 1][field]) || 0;

    return lastValue - firstValue;
  }
}

// 导出单例实例
export const chartGenerator = new ChartGenerator();

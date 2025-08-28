// Data Extractor - 数据提取器
// 负责统一的数据提取和处理，确保系统内数据源唯一性

import * as XLSX from "xlsx";
import { AIService } from "@/lib/ai/types";
import { createServiceFromEnv } from "@/lib/ai/service-factory";
import {
  UnifiedDataStructure,
  ExtractedData,
  DataSchema,
  DataMetadata,
  DataRow,
  DataValue,
  DataField,
  FieldType,
  DataStatistics,
  AIChartError,
} from "./types";

/**
 * 数据提取器接口
 */
export interface IDataExtractor {
  /** 从prompt提取数据 */
  extractFromPrompt(prompt: string): Promise<ExtractedData | null>;

  /** 从文件提取数据 */
  extractFromFiles(files: File[]): Promise<ExtractedData[]>;

  /** 标准化数据结构 */
  normalizeData(
    rawData: DataRow[],
    source: "prompt" | "file",
    metadata?: Partial<DataMetadata>
  ): UnifiedDataStructure;
}

/**
 * 数据提取器实现
 */
export class DataExtractor implements IDataExtractor {
  private aiService: AIService;

  constructor(aiService?: AIService) {
    // 使用提供的AI服务或从环境变量创建
    this.aiService = aiService || createServiceFromEnv("deepseek");
  }

  /**
   * 从prompt提取数据 - 使用AI解析
   */
  async extractFromPrompt(prompt: string): Promise<ExtractedData | null> {
    console.log("📊 [DataExtractor] 开始从prompt提取数据...");

    try {
      // 首先尝试AI解析
      const aiResult = await this.aiExtractFromPrompt(prompt);
      if (aiResult && aiResult.data.length > 0) {
        return aiResult;
      }

      // AI失败时使用正则表达式降级
      const regexResult = this.regexExtractFromPrompt(prompt);
      if (regexResult && regexResult.data.length > 0) {
        return regexResult;
      }

      console.log("📊 [DataExtractor] 未在prompt中发现可提取的数据");
      return null;
    } catch (error) {
      console.error("📊 [DataExtractor] prompt数据提取失败:", error);
      throw new AIChartError("data_extraction", "UNKNOWN_ERROR", "数据提取过程中发生错误", {
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  /**
   * 从文件提取数据
   */
  async extractFromFiles(files: File[]): Promise<ExtractedData[]> {
    console.log("📁 [DataExtractor] 开始处理文件数据，文件数量:", files.length);

    const results: ExtractedData[] = [];

    for (const file of files) {
      try {
        console.log("📁 [DataExtractor] 处理文件:", file.name);

        const fileExtension = this.getFileExtension(file.name);
        let extractedData: ExtractedData;

        switch (fileExtension) {
          case ".xlsx":
          case ".xls":
            extractedData = await this.extractFromExcel(file);
            break;

          case ".csv":
            extractedData = await this.extractFromCSV(file);
            break;

          default:
            throw new AIChartError(
              "data_extraction",
              "INVALID_REQUEST",
              `不支持的文件格式: ${fileExtension}`
            );
        }

        results.push(extractedData);
        console.log("✅ [DataExtractor] 文件处理成功:", {
          file: file.name,
          rows: extractedData.data.length,
          confidence: extractedData.confidence,
        });
      } catch (error) {
        console.error(`❌ [DataExtractor] 文件 ${file.name} 处理失败:`, error);
        throw new AIChartError(
          "data_extraction",
          "UNKNOWN_ERROR",
          `文件 ${file.name} 解析失败: ${error instanceof Error ? error.message : "未知错误"}`
        );
      }
    }

    return results;
  }

  /**
   * 标准化数据结构 - 统一数据格式
   */
  normalizeData(
    rawData: DataRow[],
    source: "prompt" | "file",
    metadata?: Partial<DataMetadata>
  ): UnifiedDataStructure {
    console.log("🔧 [DataExtractor] 开始标准化数据，数据行数:", rawData.length);

    try {
      // 数据验证
      if (!rawData || rawData.length === 0) {
        throw new AIChartError("data_extraction", "INSUFFICIENT_DATA", "没有可处理的数据");
      }

      // 生成数据架构
      const schema = this.generateDataSchema(rawData);

      // 清理和标准化数据
      const cleanedData = this.cleanData(rawData, schema);

      // 生成元数据
      const fullMetadata: DataMetadata = {
        source,
        extractedAt: new Date(),
        preview: cleanedData.slice(0, 5), // 前5行预览
        statistics: this.calculateStatistics(cleanedData, schema),
        ...metadata,
      };

      // 验证数据质量
      const validationErrors = this.validateDataQuality(cleanedData, schema);

      const result: UnifiedDataStructure = {
        data: cleanedData,
        schema,
        metadata: fullMetadata,
        isValid: validationErrors.length === 0,
        validationErrors,
      };

      console.log("✅ [DataExtractor] 数据标准化完成:", {
        rows: result.data.length,
        fields: result.schema.fields.length,
        qualityScore: result.schema.qualityScore,
        isValid: result.isValid,
      });

      return result;
    } catch (error) {
      console.error("❌ [DataExtractor] 数据标准化失败:", error);
      throw new AIChartError("data_extraction", "UNKNOWN_ERROR", "数据标准化过程失败", {
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  /**
   * AI驱动的prompt数据提取
   */
  private async aiExtractFromPrompt(prompt: string): Promise<ExtractedData | null> {
    const systemPrompt = `你是一个专业的数据提取专家。从用户描述中识别并提取结构化数据。

任务要求：
1. 仅当发现明确的数值数据时才提取
2. 识别数据的维度和度量
3. 保持数据的原始含义
4. 如果没有具体数据，返回 hasData: false

响应格式（严格JSON）：
{
  "hasData": boolean,
  "data": [
    {"字段名1": 值, "字段名2": 值, ...}
  ],
  "confidence": 0.0-1.0,
  "extractionNotes": "提取说明"
}

重要：只有在用户明确提供了具体数值、列表或表格时才提取数据。`;

    try {
      const response = await this.aiService.chat({
        messages: [{ role: "user", content: prompt }],
        systemPrompt,
        params: {
          temperature: 0.1, // 极低温度确保准确性
          maxTokens: 1000,
        },
      });

      // 解析AI响应
      let content = this.cleanJsonResponse(response.content);
      const parsed = JSON.parse(content);

      if (!parsed.hasData || !parsed.data || !Array.isArray(parsed.data)) {
        console.log("🤖 [AI Extract] AI判断没有可提取的数据");
        return null;
      }

      return {
        data: parsed.data,
        confidence: parsed.confidence || 0.8,
        extractionMethod: "ai_parsing",
        warnings: [],
      };
    } catch (error) {
      console.warn("🤖 [AI Extract] AI提取失败，将尝试正则表达式:", error);
      return null;
    }
  }

  /**
   * 正则表达式降级数据提取
   */
  private regexExtractFromPrompt(prompt: string): ExtractedData | null {
    console.log("📝 [Regex Extract] 使用正则表达式提取数据...");

    // 模式1: 城市数据格式 "北京[22, 23, 21, 25]"
    const cityDataPattern = /([^[\]]+)\[([^\]]+)\]/g;
    const cityMatches: Array<{ name: string; values: number[] }> = [];
    let match;

    while ((match = cityDataPattern.exec(prompt)) !== null) {
      const cityName = match[1].trim();
      const values = match[2]
        .split(",")
        .map(v => parseFloat(v.trim()))
        .filter(v => !isNaN(v));

      if (values.length > 0) {
        cityMatches.push({ name: cityName, values });
      }
    }

    if (cityMatches.length > 0) {
      return this.buildTimeSeriesData(cityMatches, prompt);
    }

    // 模式2: 键值对数据 "1月：850万元，2月：920万元"
    const keyValuePattern = /([^：:,，\n]+)[：:]([^,，\n]+)/g;
    const keyValueMatches: Array<{ key: string; value: number; unit?: string }> = [];

    while ((match = keyValuePattern.exec(prompt)) !== null) {
      const key = match[1].trim();
      const valueStr = match[2].trim();

      // 提取数值和单位
      const numberMatch = valueStr.match(/([\d\.]+)\s*([万千百]?[元人次台套个]?)/);
      if (numberMatch) {
        let value = parseFloat(numberMatch[1]);
        const unit = numberMatch[2];

        // 处理单位换算
        if (unit.includes("万")) {
          value = value * 10000;
        } else if (unit.includes("千")) {
          value = value * 1000;
        } else if (unit.includes("百")) {
          value = value * 100;
        }

        keyValueMatches.push({
          key,
          value,
          unit: unit.replace(/万|千|百/g, "") || "元",
        });
      }
    }

    if (keyValueMatches.length > 0) {
      return this.buildKeyValueData(keyValueMatches);
    }

    // 模式3: 简单数值列表 "销售额: 100, 200, 300"
    const simpleListPattern = /([^:：]+)[：:]\s*([0-9,，\s]+)/g;
    const listMatches: Record<string, number[]> = {};

    while ((match = simpleListPattern.exec(prompt)) !== null) {
      const label = match[1].trim();
      const values = match[2]
        .split(/[,，]/)
        .map(v => parseFloat(v.trim()))
        .filter(v => !isNaN(v));

      if (values.length > 0) {
        listMatches[label] = values;
      }
    }

    if (Object.keys(listMatches).length > 0) {
      return this.buildCategoryData(listMatches);
    }

    console.log("📝 [Regex Extract] 未匹配到任何数据模式");
    return null;
  }

  /**
   * 构建键值对数据
   */
  private buildKeyValueData(
    keyValueMatches: Array<{ key: string; value: number; unit?: string }>
  ): ExtractedData {
    const data = keyValueMatches.map(({ key, value, unit }) => ({
      [this.inferCategoryFieldName(key)]: key,
      [this.inferValueFieldName(unit || "数值")]: value,
    }));

    return {
      data,
      confidence: 0.8,
      extractionMethod: "regex_pattern",
      warnings: ["基于正则表达式提取键值对数据"],
    };
  }

  /**
   * 推断分类字段名称
   */
  private inferCategoryFieldName(sampleKey: string): string {
    if (/月/.test(sampleKey)) return "月份";
    if (/季|Q\d/.test(sampleKey)) return "季度";
    if (/年/.test(sampleKey)) return "年份";
    if (/日|天/.test(sampleKey)) return "日期";
    if (/周|星期/.test(sampleKey)) return "周";
    if (/地区|城市/.test(sampleKey)) return "地区";
    if (/产品|商品/.test(sampleKey)) return "产品";
    if (/部门|团队/.test(sampleKey)) return "部门";
    return "类别";
  }

  /**
   * 推断数值字段名称
   */
  private inferValueFieldName(unit: string): string {
    if (unit.includes("元")) return "金额(元)";
    if (unit.includes("人")) return "人数";
    if (unit.includes("台") || unit.includes("套") || unit.includes("个")) return "数量";
    if (unit.includes("次")) return "次数";
    return "数值";
  }

  /**
   * 构建时间序列数据
   */
  private buildTimeSeriesData(
    cityMatches: Array<{ name: string; values: number[] }>,
    prompt: string
  ): ExtractedData {
    // 推断时间维度
    const maxLength = Math.max(...cityMatches.map(m => m.values.length));
    const timeLabels = this.inferTimeLabels(prompt, maxLength);

    const data = timeLabels.map((time, index) => {
      const dataPoint: DataRow = { time };
      cityMatches.forEach(({ name, values }) => {
        dataPoint[name] = values[index] || 0;
      });
      return dataPoint;
    });

    return {
      data,
      confidence: 0.7,
      extractionMethod: "regex_pattern",
      warnings: ["基于正则表达式提取，请验证数据准确性"],
    };
  }

  /**
   * 构建分类数据
   */
  private buildCategoryData(listMatches: Record<string, number[]>): ExtractedData {
    const firstKey = Object.keys(listMatches)[0];
    const maxLength = Math.max(...Object.values(listMatches).map(arr => arr.length));

    const data = Array.from({ length: maxLength }, (_, index) => {
      const dataPoint: DataRow = { category: `类别${index + 1}` };
      Object.entries(listMatches).forEach(([key, values]) => {
        dataPoint[key] = values[index] || 0;
      });
      return dataPoint;
    });

    return {
      data,
      confidence: 0.6,
      extractionMethod: "regex_pattern",
      warnings: ["基于模式匹配提取，建议提供更结构化的数据"],
    };
  }

  /**
   * Excel文件数据提取
   */
  private async extractFromExcel(file: File): Promise<ExtractedData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = e => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (jsonData.length === 0) {
            reject(new AIChartError("data_extraction", "INSUFFICIENT_DATA", "文件内容为空"));
            return;
          }

          const headers = jsonData[0] as string[];
          const rows = jsonData
            .slice(1)
            .filter(
              (row: any) => Array.isArray(row) && row.some(cell => cell !== null && cell !== "")
            ) as any[][];

          const structuredData = rows.map((row: unknown[]) => {
            const obj: DataRow = {};
            headers.forEach((header, index) => {
              const fieldName = header || `Column_${index + 1}`;
              const value = row[index];
              obj[fieldName] = value === undefined || value === null ? "" : (value as DataValue);
            });
            return obj;
          });

          resolve({
            data: structuredData,
            confidence: 0.9,
            extractionMethod: "file_parsing",
            warnings: structuredData.length === 0 ? ["文件中没有有效数据行"] : [],
          });
        } catch (error) {
          reject(
            new AIChartError(
              "data_extraction",
              "UNKNOWN_ERROR",
              `Excel文件解析失败: ${error instanceof Error ? error.message : "未知错误"}`
            )
          );
        }
      };

      reader.onerror = () =>
        reject(new AIChartError("data_extraction", "UNKNOWN_ERROR", "文件读取失败"));

      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * CSV文件数据提取
   */
  private async extractFromCSV(file: File): Promise<ExtractedData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = e => {
        try {
          const csvText = e.target?.result as string;
          const lines = csvText.split("\n").filter(line => line.trim());

          if (lines.length === 0) {
            reject(new AIChartError("data_extraction", "INSUFFICIENT_DATA", "CSV文件内容为空"));
            return;
          }

          const headers = lines[0].split(",").map(h => h.trim());
          const dataRows = lines.slice(1);

          const structuredData = dataRows.map(row => {
            const values = row.split(",").map(v => v.trim());
            const obj: DataRow = {};
            headers.forEach((header, index) => {
              obj[header] = values[index] || "";
            });
            return obj;
          });

          resolve({
            data: structuredData,
            confidence: 0.9,
            extractionMethod: "file_parsing",
            warnings: [],
          });
        } catch (error) {
          reject(
            new AIChartError(
              "data_extraction",
              "UNKNOWN_ERROR",
              `CSV文件解析失败: ${error instanceof Error ? error.message : "未知错误"}`
            )
          );
        }
      };

      reader.onerror = () =>
        reject(new AIChartError("data_extraction", "UNKNOWN_ERROR", "CSV文件读取失败"));

      reader.readAsText(file);
    });
  }

  // 辅助方法们...

  private generateDataSchema(data: DataRow[]): DataSchema {
    if (data.length === 0) {
      return {
        fields: [],
        rowCount: 0,
        qualityScore: 0,
      };
    }

    const sampleSize = Math.min(data.length, 100);
    const sample = data.slice(0, sampleSize);
    const fieldInfo: Record<string, any> = {};

    // 分析每个字段
    Object.keys(data[0] || {}).forEach(fieldName => {
      const values = sample.map(row => row[fieldName]).filter(v => v != null);
      const uniqueValues = new Set(values);

      fieldInfo[fieldName] = {
        name: fieldName,
        type: this.inferFieldType(values),
        nullable: values.length < sample.length,
        unique: uniqueValues.size === values.length && values.length > 1,
        sampleValues: Array.from(uniqueValues).slice(0, 5),
      };
    });

    const fields = Object.values(fieldInfo);
    const qualityScore = this.calculateQualityScore(data, fields);

    return {
      fields,
      rowCount: data.length,
      qualityScore,
    };
  }

  private inferFieldType(values: DataValue[]): FieldType {
    if (values.length === 0) return "string";

    const numericCount = values.filter(v => v !== null && !isNaN(Number(v))).length;
    const dateCount = values.filter(
      v => v !== null && typeof v === "string" && !isNaN(Date.parse(v))
    ).length;
    const booleanCount = values.filter(
      v =>
        typeof v === "boolean" ||
        (v !== null && ["true", "false", "是", "否", "yes", "no"].includes(String(v).toLowerCase()))
    ).length;

    const total = values.length;

    if (booleanCount / total > 0.8) return "boolean";
    if (numericCount / total > 0.8) return "number";
    if (dateCount / total > 0.6) return "date";
    return "string";
  }

  private calculateQualityScore(data: DataRow[], fields: DataField[]): number {
    let score = 1.0;

    // 数据完整性
    const totalCells = data.length * fields.length;
    const emptyCells = data.reduce(
      (count, row) =>
        count +
        fields.reduce(
          (fieldCount, field) =>
            fieldCount + (row[field.name] == null || row[field.name] === "" ? 1 : 0),
          0
        ),
      0
    );

    const completeness = 1 - emptyCells / totalCells;
    score *= completeness;

    // 数据一致性
    const consistencyScore =
      fields.reduce((avg, field) => {
        const values = data.map(row => row[field.name]).filter(v => v != null);
        const typeConsistency = this.calculateTypeConsistency(values, field.type);
        return avg + typeConsistency;
      }, 0) / fields.length;

    score *= consistencyScore;

    return Math.max(0, Math.min(1, score));
  }

  private calculateTypeConsistency(values: DataValue[], expectedType: string): number {
    if (values.length === 0) return 1;

    let consistentCount = 0;

    for (const value of values) {
      const actualType = this.inferFieldType([value]);
      if (actualType === expectedType) {
        consistentCount++;
      }
    }

    return consistentCount / values.length;
  }

  private cleanData(rawData: DataRow[], schema: DataSchema): DataRow[] {
    return rawData.map(row => {
      const cleanedRow: DataRow = {};

      schema.fields.forEach(field => {
        let value = row[field.name];

        // 类型转换和清理
        switch (field.type) {
          case "number":
            if (value == null) {
              value = null;
            } else {
              const numValue = Number(value);
              value = isNaN(numValue) ? null : numValue;
            }
            break;
          case "date":
            if (value != null && (typeof value === "string" || typeof value === "number")) {
              const date = new Date(value);
              value = isNaN(date.getTime()) ? null : date.toISOString();
            } else {
              value = null;
            }
            break;
          case "boolean":
            if (value != null) {
              const str = String(value).toLowerCase();
              value = ["true", "1", "是", "yes"].includes(str);
            }
            break;
          default:
            value = value == null ? null : String(value).trim();
        }

        cleanedRow[field.name] = value;
      });

      return cleanedRow;
    });
  }

  private calculateStatistics(data: DataRow[], schema: DataSchema): DataStatistics {
    const numericFields = schema.fields.filter(f => f.type === "number").map(f => f.name);
    const categoricalFields = schema.fields.filter(f => f.type === "string").map(f => f.name);
    const dateFields = schema.fields.filter(f => f.type === "date").map(f => f.name);

    const missingValues = data.reduce(
      (count, row) => count + Object.values(row).filter(v => v == null).length,
      0
    );

    return {
      numericFields,
      categoricalFields,
      dateFields,
      missingValues,
    };
  }

  private validateDataQuality(data: DataRow[], schema: DataSchema): string[] {
    const errors: string[] = [];

    if (data.length === 0) {
      errors.push("数据集为空");
    }

    if (schema.fields.length === 0) {
      errors.push("没有检测到有效的数据字段");
    }

    if (schema.qualityScore < 0.5) {
      errors.push("数据质量评分过低，可能影响图表生成效果");
    }

    return errors;
  }

  private inferTimeLabels(prompt: string, length: number): string[] {
    // 检查是否提到了具体的时间标签
    if (/星期|周/.test(prompt)) {
      return ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"].slice(
        0,
        length
      );
    }

    if (/月份|月/.test(prompt)) {
      return [
        "1月",
        "2月",
        "3月",
        "4月",
        "5月",
        "6月",
        "7月",
        "8月",
        "9月",
        "10月",
        "11月",
        "12月",
      ].slice(0, length);
    }

    // 默认使用天数
    return Array.from({ length }, (_, i) => `第${i + 1}天`);
  }

  private cleanJsonResponse(content: string): string {
    let cleaned = content.trim();

    // 移除markdown代码块
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    return cleaned;
  }

  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf(".");
    return lastDot !== -1 ? filename.substring(lastDot).toLowerCase() : "";
  }
}

// 导出单例实例
export const dataExtractor = new DataExtractor();

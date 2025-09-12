// AI Chart Director - 系统总协调器
// 整合所有组件，实现三种场景的统一处理

import { AIService } from '@/lib/ai/types';
import { createServiceFromEnv } from '@/lib/ai/service-factory';
import { 
  ScenarioType, 
  AIChartResult, 
  ChartGenerationResult,
  ChartGenerationError,
  AIChartError,
  AIChartSystemConfig 
} from './types';
import { InputRouter, IInputRouter } from './input-router';
import { DataExtractor, IDataExtractor } from './data-extractor';
import { IntentAnalyzer, IIntentAnalyzer } from './intent-analyzer';
import { ChartGenerator, IChartGenerator } from './chart-generator';

/**
 * AI图表系统输入
 */
export interface AIChartSystemInput {
  prompt: string;
  files?: File[];
}

/**
 * AI图表总协调器接口
 */
export interface IAIChartDirector {
  /** 处理图表生成请求 */
  generateChart(input: AIChartSystemInput): Promise<AIChartResult>;
  
  /** 获取系统状态 */
  getSystemStatus(): Promise<{
    aiServiceConnected: boolean;
    componentsInitialized: boolean;
    lastError?: string;
  }>;
}

/**
 * AI图表总协调器实现
 */
export class AIChartDirector implements IAIChartDirector {
  private inputRouter: IInputRouter;
  private dataExtractor: IDataExtractor;
  private intentAnalyzer: IIntentAnalyzer;
  private chartGenerator: IChartGenerator;
  private aiService: AIService;
  private lastError?: string;

  constructor(config?: Partial<AIChartSystemConfig>, aiService?: AIService) {
    console.log('🚀 [AIChartDirector] 初始化AI图表系统...');
    
    try {
      // 初始化AI服务
      this.aiService = aiService || createServiceFromEnv("deepseek");
      
      // 初始化各个组件
      this.inputRouter = new InputRouter();
      this.dataExtractor = new DataExtractor(this.aiService);
      this.intentAnalyzer = new IntentAnalyzer(this.aiService);
      this.chartGenerator = new ChartGenerator();
      
      console.log('✅ [AIChartDirector] 系统初始化完成');
    } catch (error) {
      console.error('❌ [AIChartDirector] 系统初始化失败:', error);
      throw new AIChartError(
        'input_validation',
        'SERVICE_UNAVAILABLE',
        '系统初始化失败',
        { error: error instanceof Error ? error.message : error }
      );
    }
  }

  /**
   * 处理图表生成请求 - 主要入口
   */
  async generateChart(input: AIChartSystemInput): Promise<AIChartResult> {
    const startTime = Date.now();
    
    console.log('🎯 [AIChartDirector] 开始处理图表生成请求:', {
      promptLength: input.prompt.length,
      fileCount: input.files?.length || 0
    });

    try {
      // 步骤1: 输入路由和验证
      const scenario = await this.routeAndValidateInput(input);
      console.log('✅ [AIChartDirector] 场景识别:', scenario);

      // 步骤2: 根据场景处理数据
      const unifiedData = await this.extractAndUnifyData(scenario, input);
      console.log('✅ [AIChartDirector] 数据提取完成:', {
        rows: unifiedData.data.length,
        fields: unifiedData.schema.fields.length,
        sampleData: unifiedData.data.slice(0, 3), // 显示前3行数据样本
        dataSchema: unifiedData.schema
      });

      // 步骤3: 分析用户意图
      const chartIntent = await this.analyzeIntent(scenario, input, unifiedData);
      console.log('✅ [AIChartDirector] 意图分析完成:', {
        chartType: chartIntent.chartType,
        confidence: chartIntent.confidence,
        reasoning: chartIntent.reasoning || '未提供推理过程',
        suggestedTitle: chartIntent.suggestedTitle || '未提供标题建议'
      });

      // 步骤4: 验证数据兼容性
      const compatibility = this.intentAnalyzer.validateDataCompatibility(chartIntent, unifiedData);
      console.log('🔍 [AIChartDirector] 数据兼容性检查:', {
        isCompatible: compatibility.isCompatible,
        reason: compatibility.reason,
        chartType: chartIntent.chartType,
        dataRows: unifiedData.data.length,
        dataFields: unifiedData.schema.fields.length
      });
      
      if (!compatibility.isCompatible) {
        console.error('❌ [AIChartDirector] 数据兼容性验证失败:', compatibility);
        throw new AIChartError(
          'intent_analysis',
          'INVALID_REQUEST',
          `数据与图表要求不兼容: ${compatibility.reason}`,
          { compatibility }
        );
      }

      // 步骤5: 生成图表
      console.log('🎨 [AIChartDirector] 开始生成图表...');
      const result = await this.chartGenerator.generateChart(chartIntent, unifiedData);
      console.log('📊 [AIChartDirector] 图表生成器返回结果:', {
        success: result.success,
        chartType: result.success ? result.chartType : 'failed',
        dataLength: result.success ? result.data.length : 0,
        configKeys: result.success ? Object.keys(result.config) : []
      });
      
      const totalTime = Date.now() - startTime;
      console.log('🎉 [AIChartDirector] 图表生成成功:', {
        chartType: result.chartType,
        processingTime: totalTime,
        confidence: result.metadata.confidence
      });

      return result;

    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error);
      console.error('❌ [AIChartDirector] 图表生成失败:', error);

      // 构建错误结果
      const errorResult: ChartGenerationError = {
        success: false,
        error: error instanceof AIChartError ? error : new AIChartError(
          'chart_generation',
          'UNKNOWN_ERROR',
          '图表生成过程中发生未知错误',
          { originalError: error instanceof Error ? error.message : error }
        ),
        failedStage: this.determineFailedStage(error),
        suggestions: this.generateErrorSuggestions(error, input)
      };

      return errorResult;
    }
  }

  /**
   * 获取系统状态
   */
  async getSystemStatus(): Promise<{
    aiServiceConnected: boolean;
    componentsInitialized: boolean;
    lastError?: string;
  }> {
    try {
      const aiServiceConnected = await this.aiService.validateConnection();
      
      return {
        aiServiceConnected,
        componentsInitialized: !!(
          this.inputRouter && 
          this.dataExtractor && 
          this.intentAnalyzer && 
          this.chartGenerator
        ),
        lastError: this.lastError
      };
    } catch (error) {
      return {
        aiServiceConnected: false,
        componentsInitialized: false,
        lastError: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 步骤1: 输入路由和验证
   */
  private async routeAndValidateInput(input: AIChartSystemInput): Promise<ScenarioType> {
    console.log('🔍 [Stage1] 输入路由和验证...');
    
    const { prompt, files = [] } = input;
    
    // 场景分类
    const scenario = this.inputRouter.classifyScenario(prompt, files);
    
    // 输入验证
    const validation = this.inputRouter.validateInput(scenario, prompt, files);
    if (!validation.isValid) {
      throw new AIChartError(
        'input_validation',
        'INVALID_REQUEST',
        `输入验证失败: ${validation.errors.join(', ')}`,
        { validation }
      );
    }

    // 输出警告（如果有）
    if (validation.warnings.length > 0) {
      console.warn('⚠️ [Stage1] 输入警告:', validation.warnings);
    }

    return scenario;
  }

  /**
   * 步骤2: 数据提取和统一
   */
  private async extractAndUnifyData(scenario: ScenarioType, input: AIChartSystemInput) {
    console.log('📊 [Stage2] 数据提取和统一...');
    
    const { prompt, files = [] } = input;

    switch (scenario) {
      case 'PROMPT_ONLY':
        return this.handlePromptOnlyData(prompt);
      
      case 'PROMPT_WITH_FILE':
        return this.handlePromptWithFileData(prompt, files);
      
      case 'FILE_ONLY':
        return this.handleFileOnlyData(files);
      
      default:
        throw new AIChartError(
          'data_extraction',
          'INVALID_REQUEST',
          `不支持的场景类型: ${scenario}`
        );
    }
  }

  /**
   * 步骤3: 意图分析
   */
  private async analyzeIntent(scenario: ScenarioType, input: AIChartSystemInput, data: any) {
    console.log('🎯 [Stage3] 意图分析...');
    
    switch (scenario) {
      case 'PROMPT_ONLY':
      case 'PROMPT_WITH_FILE':
        return this.intentAnalyzer.analyzeChartIntent(input.prompt, data);
      
      case 'FILE_ONLY':
        return this.intentAnalyzer.suggestBestVisualization(data);
      
      default:
        throw new AIChartError(
          'intent_analysis',
          'INVALID_REQUEST',
          `意图分析不支持场景: ${scenario}`
        );
    }
  }

  /**
   * 处理仅Prompt场景
   */
  private async handlePromptOnlyData(prompt: string) {
    console.log('📝 [PromptOnly] 处理仅Prompt场景...');
    
    // 从prompt提取数据
    const extractedData = await this.dataExtractor.extractFromPrompt(prompt);
    
    if (!extractedData || extractedData.data.length === 0) {
      throw new AIChartError(
        'data_extraction',
        'INSUFFICIENT_DATA',
        '未在描述中发现可用的数据。请提供具体的数值、表格或数据列表，或上传数据文件。',
        { 
          suggestions: [
            '提供具体的数字数据',
            '使用表格格式描述',
            '上传Excel或CSV文件'
          ]
        }
      );
    }

    // 标准化数据
    return this.dataExtractor.normalizeData(extractedData.data, 'prompt', {
      fileInfo: undefined
    });
  }

  /**
   * 处理Prompt+文件场景
   */
  private async handlePromptWithFileData(prompt: string, files: File[]) {
    console.log('📁📝 [PromptWithFile] 处理Prompt+文件场景...');
    
    // 提取文件数据
    const fileDataList = await this.dataExtractor.extractFromFiles(files);
    
    if (fileDataList.length === 0) {
      throw new AIChartError(
        'data_extraction',
        'INSUFFICIENT_DATA',
        '文件数据提取失败'
      );
    }

    // 使用第一个文件的数据（未来可以支持多文件合并）
    const primaryFileData = fileDataList[0];
    
    // 标准化数据
    return this.dataExtractor.normalizeData(primaryFileData.data, 'file', {
      fileInfo: {
        name: files[0].name,
        size: files[0].size,
        type: files[0].type
      }
    });
  }

  /**
   * 处理仅文件场景
   */
  private async handleFileOnlyData(files: File[]) {
    console.log('📁 [FileOnly] 处理仅文件场景...');
    
    // 提取文件数据
    const fileDataList = await this.dataExtractor.extractFromFiles(files);
    
    if (fileDataList.length === 0) {
      throw new AIChartError(
        'data_extraction',
        'INSUFFICIENT_DATA',
        '文件数据提取失败'
      );
    }

    // 使用第一个文件的数据
    const primaryFileData = fileDataList[0];
    
    // 标准化数据
    return this.dataExtractor.normalizeData(primaryFileData.data, 'file', {
      fileInfo: {
        name: files[0].name,
        size: files[0].size,
        type: files[0].type
      }
    });
  }

  /**
   * 确定失败阶段
   */
  private determineFailedStage(error: any): ChartGenerationError['failedStage'] {
    if (error instanceof AIChartError) {
      return error.stage;
    }
    
    // 基于错误消息推断
    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    
    if (message.includes('验证') || message.includes('输入')) {
      return 'input_validation';
    } else if (message.includes('数据') || message.includes('提取')) {
      return 'data_extraction';
    } else if (message.includes('意图') || message.includes('分析')) {
      return 'intent_analysis';
    } else {
      return 'chart_generation';
    }
  }

  /**
   * 生成错误建议
   */
  private generateErrorSuggestions(error: any, input: AIChartSystemInput): string[] {
    const suggestions: string[] = [];
    
    if (error instanceof AIChartError) {
      switch (error.stage) {
        case 'input_validation':
          suggestions.push('请检查输入的描述文本或文件格式');
          suggestions.push('确保文件为Excel (.xlsx, .xls) 或CSV格式');
          break;
          
        case 'data_extraction':
          suggestions.push('请提供更明确的数据信息');
          suggestions.push('确保文件包含有效的数值数据');
          if (!input.files || input.files.length === 0) {
            suggestions.push('考虑上传数据文件以获得更好的效果');
          }
          break;
          
        case 'intent_analysis':
          suggestions.push('请提供更具体的图表需求描述');
          suggestions.push('明确指出要对比、分析或展示的数据内容');
          break;
          
        case 'chart_generation':
          suggestions.push('请检查数据格式和完整性');
          suggestions.push('尝试简化数据或调整图表要求');
          break;
      }
    } else {
      suggestions.push('请稍后重试，或联系技术支持');
      suggestions.push('确保网络连接正常');
    }
    
    return suggestions;
  }
}

// 导出单例实例
export const aiChartDirector = new AIChartDirector();

// 导出便捷函数
export async function generateChart(input: AIChartSystemInput): Promise<AIChartResult> {
  return aiChartDirector.generateChart(input);
}

export async function getSystemStatus() {
  return aiChartDirector.getSystemStatus();
}
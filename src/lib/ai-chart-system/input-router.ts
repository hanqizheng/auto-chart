// Input Router - 输入路由器
// 负责场景分类和输入验证

import { ScenarioType, ValidationResult, AIChartError } from './types';

/**
 * 输入路由器接口
 */
export interface IInputRouter {
  /** 分类场景类型 */
  classifyScenario(prompt: string, files: File[]): ScenarioType;
  
  /** 验证输入合法性 */
  validateInput(scenario: ScenarioType, prompt: string, files: File[]): ValidationResult;
}

/**
 * 输入路由器实现
 */
export class InputRouter implements IInputRouter {
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly SUPPORTED_FILE_TYPES = ['.xlsx', '.xls', '.csv'];
  private readonly MIN_PROMPT_LENGTH = 3;

  /**
   * 分类输入场景
   */
  classifyScenario(prompt: string, files: File[]): ScenarioType {
    const hasPrompt = prompt && prompt.trim().length >= this.MIN_PROMPT_LENGTH;
    const hasFiles = files && files.length > 0;

    if (hasPrompt && hasFiles) {
      return 'PROMPT_WITH_FILE';
    } else if (hasPrompt && !hasFiles) {
      return 'PROMPT_ONLY';
    } else if (!hasPrompt && hasFiles) {
      return 'FILE_ONLY';
    } else {
      throw new AIChartError(
        'input_validation',
        'INVALID_REQUEST',
        '请提供有效的输入：描述文本或文件数据'
      );
    }
  }

  /**
   * 验证输入合法性
   */
  validateInput(scenario: ScenarioType, prompt: string, files: File[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      switch (scenario) {
        case 'PROMPT_ONLY':
          this.validatePromptOnlyInput(prompt, errors, warnings);
          break;
        
        case 'PROMPT_WITH_FILE':
          this.validatePromptWithFileInput(prompt, files, errors, warnings);
          break;
        
        case 'FILE_ONLY':
          this.validateFileOnlyInput(files, errors, warnings);
          break;
        
        default:
          errors.push('未知的场景类型');
      }
    } catch (error) {
      errors.push(`输入验证失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 验证仅Prompt场景
   */
  private validatePromptOnlyInput(prompt: string, errors: string[], warnings: string[]): void {
    // 基本长度检查
    if (!prompt || prompt.trim().length < this.MIN_PROMPT_LENGTH) {
      errors.push('描述文本太短，请提供更详细的说明');
      return;
    }

    // 检查是否包含数据指示词
    const dataIndicators = this.detectDataIndicators(prompt);
    if (dataIndicators.length === 0) {
      errors.push('未在描述中检测到具体的数据信息。请提供具体的数值、类别或时间数据，或上传数据文件');
      return;
    }

    // 检查描述质量
    if (prompt.length < 20) {
      warnings.push('描述较简短，可能影响图表生成质量，建议提供更多详细信息');
    }

    console.log('✅ 仅Prompt场景验证通过，检测到数据指示词:', dataIndicators);
  }

  /**
   * 验证Prompt+文件场景
   */
  private validatePromptWithFileInput(prompt: string, files: File[], errors: string[], warnings: string[]): void {
    // 验证prompt
    if (!prompt || prompt.trim().length < this.MIN_PROMPT_LENGTH) {
      errors.push('请提供对图表需求的描述说明');
    }

    // 验证文件
    this.validateFiles(files, errors, warnings);

    console.log('✅ Prompt+文件场景验证:', { 
      promptLength: prompt.length, 
      fileCount: files.length 
    });
  }

  /**
   * 验证仅文件场景
   */
  private validateFileOnlyInput(files: File[], errors: string[], warnings: string[]): void {
    // 验证文件
    this.validateFiles(files, errors, warnings);

    if (files.length === 0) {
      errors.push('请上传数据文件');
    }

    warnings.push('将自动分析数据并推荐最佳图表类型');
    
    console.log('✅ 仅文件场景验证:', { fileCount: files.length });
  }

  /**
   * 验证文件合法性
   */
  private validateFiles(files: File[], errors: string[], warnings: string[]): void {
    if (!files || files.length === 0) {
      errors.push('未检测到文件');
      return;
    }

    if (files.length > 3) {
      errors.push('最多同时处理3个文件');
    }

    for (const file of files) {
      // 检查文件大小
      if (file.size > this.MAX_FILE_SIZE) {
        errors.push(`文件 ${file.name} 过大，最大支持10MB`);
      }

      // 检查文件类型
      const fileExtension = this.getFileExtension(file.name);
      if (!this.SUPPORTED_FILE_TYPES.includes(fileExtension)) {
        errors.push(`文件 ${file.name} 格式不支持，仅支持 Excel (.xlsx, .xls) 和 CSV 文件`);
      }

      // 检查文件名
      if (file.name.length > 100) {
        warnings.push(`文件名 ${file.name} 过长`);
      }
    }
  }

  /**
   * 检测描述中的数据指示词
   */
  private detectDataIndicators(prompt: string): string[] {
    const indicators: string[] = [];
    const lowerPrompt = prompt.toLowerCase();

    // 数字模式检测
    const numberPatterns = [
      /\d+/g, // 任何数字
      /[一二三四五六七八九十百千万亿]+/g, // 中文数字
      /\d+[%％]/g, // 百分比
      /\d+[万千百十]/g, // 中文数量单位
    ];

    for (const pattern of numberPatterns) {
      const matches = prompt.match(pattern);
      if (matches && matches.length > 0) {
        indicators.push('数值数据');
        break;
      }
    }

    // 数据列表模式检测 (如: A[1,2,3] 或 北京[22,23,24])
    if (/\w+\s*\[[^\]]+\]/g.test(prompt)) {
      indicators.push('结构化数据列表');
    }

    // 时间模式检测
    const timePatterns = [
      /\d{4}[年\-\/]\d{1,2}[月\-\/]\d{1,2}[日]?/g, // 日期
      /星期[一二三四五六日天]/g, // 星期
      /周[一二三四五六日天]/g, // 周
      /[一二三四五六七八九十]月/g, // 月份
      /\d+[月日时分秒]/g, // 时间单位
    ];

    for (const pattern of timePatterns) {
      if (pattern.test(prompt)) {
        indicators.push('时间数据');
        break;
      }
    }

    // 分类数据检测
    const categoryKeywords = [
      '产品', '地区', '类别', '部门', '渠道', '品牌', '类型', '分类',
      '省份', '城市', '区域', '行业', '公司', '团队', '项目'
    ];

    for (const keyword of categoryKeywords) {
      if (lowerPrompt.includes(keyword)) {
        indicators.push('分类数据');
        break;
      }
    }

    // 数据关系检测
    const relationKeywords = [
      '比较', '对比', '增长', '下降', '变化', '趋势', '分布', '占比',
      '份额', '排名', '排序', '最高', '最低', '平均', '总计'
    ];

    for (const keyword of relationKeywords) {
      if (lowerPrompt.includes(keyword)) {
        indicators.push('数据关系');
        break;
      }
    }

    return [...new Set(indicators)]; // 去重
  }

  /**
   * 获取文件扩展名
   */
  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.substring(lastDot).toLowerCase() : '';
  }

  /**
   * 获取场景描述
   */
  getScenarioDescription(scenario: ScenarioType): string {
    switch (scenario) {
      case 'PROMPT_ONLY':
        return '纯文本描述场景：将从描述中提取数据信息并生成图表';
      case 'PROMPT_WITH_FILE':
        return '文件+描述场景：基于上传文件和描述需求生成图表';
      case 'FILE_ONLY':
        return '纯文件场景：自动分析文件数据并推荐最佳图表';
      default:
        return '未知场景';
    }
  }
}

// 导出单例实例
export const inputRouter = new InputRouter();
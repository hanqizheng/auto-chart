// API路由：处理邮件解析请求 - 简化版本

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { join } from 'path';
import { SimpleEmailParser } from '@/lib/email-parser';
import { EMAIL_PARSER_CONFIG, FILE_VALIDATION } from '@/constants/email';
import type { EmailFile, ParsingConfig, ProjectInfo, StageInfo } from '@/types/email';

/**
 * 加载项目和阶段数据
 */
async function loadProjectsAndStages(): Promise<{ projects: ProjectInfo[]; stages: StageInfo[] }> {
  try {
    const projectsPath = join(process.cwd(), 'projects.json');
    const stagesPath = join(process.cwd(), 'stages.json');
    
    const [projectsData, stagesData] = await Promise.all([
      fs.readFile(projectsPath, 'utf8').then((data: string) => JSON.parse(data)),
      fs.readFile(stagesPath, 'utf8').then((data: string) => JSON.parse(data))
    ]);
    
    return {
      projects: projectsData.projects || [],
      stages: stagesData.stages || []
    };
  } catch (error) {
    console.error('❌ 加载项目和阶段数据失败:', error);
    return { projects: [], stages: [] };
  }
}

/**
 * 扫描test-emails文件夹，获取邮件文件信息
 */
async function scanTestEmailsFolder(): Promise<{ files: string[]; count: number }> {
  try {
    const testEmailsDir = join(process.cwd(), 'test-emails');
    
    // 检查文件夹是否存在
    try {
      await fs.access(testEmailsDir);
    } catch {
      console.warn('⚠️ test-emails 文件夹不存在，创建空文件夹');
      await fs.mkdir(testEmailsDir, { recursive: true });
      return { files: [], count: 0 };
    }

    const allFiles = await fs.readdir(testEmailsDir);
    
    // 过滤只保留.eml文件
    const emlFiles = allFiles.filter(filename => 
      FILE_VALIDATION.ALLOWED_EXTENSIONS.some(ext => filename.toLowerCase().endsWith(ext))
    );
    
    console.log(`📁 扫描test-emails文件夹: 找到 ${emlFiles.length}/${allFiles.length} 个邮件文件`);
    
    return {
      files: emlFiles,
      count: emlFiles.length
    };
  } catch (error) {
    console.error('❌ 扫描test-emails文件夹失败:', error);
    return { files: [], count: 0 };
  }
}

/**
 * 读取test-emails文件夹中的邮件文件
 */
async function loadTestEmails(): Promise<EmailFile[]> {
  try {
    const testEmailsDir = join(process.cwd(), 'test-emails');
    const { files } = await scanTestEmailsFolder();
    
    if (files.length === 0) {
      return [];
    }

    console.log(`📧 开始读取 ${files.length} 个邮件文件`);
    
    const emailFiles: EmailFile[] = [];
    
    for (const filename of files) {
      try {
        const filePath = join(testEmailsDir, filename);
        const stats = await fs.stat(filePath);
        
        // 检查文件大小
        if (stats.size > EMAIL_PARSER_CONFIG.MAX_FILE_SIZE) {
          console.warn(`⚠️ 跳过过大的文件: ${filename} (${stats.size} bytes)`);
          continue;
        }
        
        const content = await fs.readFile(filePath, 'utf-8');
        
        emailFiles.push({
          filename,
          content,
          size: stats.size,
        });
        
        console.log(`✅ 读取邮件文件: ${filename} (${stats.size} bytes)`);
        
      } catch (error) {
        console.error(`❌ 读取邮件文件失败: ${filename}`, error);
      }
    }
    
    console.log(`📧 成功读取 ${emailFiles.length}/${files.length} 个邮件文件`);
    return emailFiles;
    
  } catch (error) {
    console.error('❌ 加载邮件文件失败:', error);
    return [];
  }
}

/**
 * POST: 执行邮件解析
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📧 [API] 接收到邮件解析请求');
    
    // 解析请求参数
    const body = await request.json();
    const { enableAI = true } = body;
    
    console.log(`📧 [API] 解析配置: AI=${enableAI}`);
    
    // 读取邮件文件
    const emailFiles = await loadTestEmails();
    
    if (emailFiles.length === 0) {
      return NextResponse.json(
        { 
          error: '没有找到邮件文件',
          details: 'test-emails 文件夹中没有找到 .eml 文件'
        },
        { status: 400 }
      );
    }
    
    // 检查文件数量限制
    if (emailFiles.length > EMAIL_PARSER_CONFIG.MAX_FILES_COUNT) {
      return NextResponse.json(
        { 
          error: `邮件文件数量过多`,
          details: `找到 ${emailFiles.length} 个文件，最多支持 ${EMAIL_PARSER_CONFIG.MAX_FILES_COUNT} 个文件`
        },
        { status: 400 }
      );
    }
    
    console.log(`📧 [API] 准备解析 ${emailFiles.length} 个邮件文件`);
    
    // 加载配置数据
    const { projects, stages } = await loadProjectsAndStages();
    
    // 构建解析配置
    const config: ParsingConfig = {
      enableAI,
      fuzzyMatchThreshold: EMAIL_PARSER_CONFIG.FUZZY_MATCH_THRESHOLD,
      aiConfidenceThreshold: EMAIL_PARSER_CONFIG.AI_CONFIDENCE_THRESHOLD,
      maxContentLength: EMAIL_PARSER_CONFIG.MAX_CONTENT_LENGTH,
      projects,
      stages
    };
    
    console.log(`📧 [API] 配置加载完成: ${projects.length} 个项目, ${stages.length} 个阶段`);
    
    // 创建解析器并执行解析
    const parser = new SimpleEmailParser();
    const result = await parser.parseEmails(emailFiles, config);
    
    console.log(`📧 [API] 解析完成: 成功 ${result.summary.successful}/${result.summary.total}, 耗时 ${result.summary.processingTime}ms`);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('❌ [API] 邮件解析API错误:', error);
    
    return NextResponse.json(
      { 
        error: '服务器内部错误',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

/**
 * GET: 获取test-emails文件夹信息和解析配置
 */
export async function GET() {
  try {
    // 扫描test-emails文件夹
    const { files, count } = await scanTestEmailsFolder();
    
    // 加载配置
    const { projects, stages } = await loadProjectsAndStages();
    
    return NextResponse.json({
      // 文件信息
      filesCount: count,
      files: files,
      
      // 配置信息
      config: {
        maxFileSize: EMAIL_PARSER_CONFIG.MAX_FILE_SIZE,
        maxFilesCount: EMAIL_PARSER_CONFIG.MAX_FILES_COUNT,
        supportedFormats: FILE_VALIDATION.ALLOWED_EXTENSIONS,
        fuzzyMatchThreshold: EMAIL_PARSER_CONFIG.FUZZY_MATCH_THRESHOLD,
        aiConfidenceThreshold: EMAIL_PARSER_CONFIG.AI_CONFIDENCE_THRESHOLD,
      },
      
      // 元数据
      projectsCount: projects.length,
      stagesCount: stages.length,
      availableStages: stages.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description
      }))
    });
    
  } catch (error) {
    console.error('❌ [API] 获取信息失败:', error);
    
    return NextResponse.json(
      { error: '获取信息失败' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS: CORS预检请求处理
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
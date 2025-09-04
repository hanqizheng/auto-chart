"use client";

import React, { useState, useCallback, useEffect } from "react";
import { FileText, Download, AlertCircle, CheckCircle, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

import type { EmailParsingResult, BatchParsingResult, ParsingStatus } from "@/types/email";

interface ProcessingState {
  status: ParsingStatus;
  progress: number;
  currentFile: string;
  results: EmailParsingResult[];
  errors: string[];
}

export default function EmailParserPage() {
  const [processing, setProcessing] = useState<ProcessingState>({
    status: "pending",
    progress: 0,
    currentFile: "",
    results: [],
    errors: []
  });
  const [enableAI, setEnableAI] = useState(true);
  const [selectedResults, setSelectedResults] = useState<Set<number>>(new Set());
  const [testEmailsInfo, setTestEmailsInfo] = useState<{
    count: number;
    files: string[];
  } | null>(null);

  // 获取test-emails文件夹信息
  useEffect(() => {
    const fetchTestEmailsInfo = async () => {
      try {
        const response = await fetch('/api/email-parser');
        if (response.ok) {
          const data = await response.json();
          setTestEmailsInfo({
            count: data.filesCount || 0,
            files: data.files || []
          });
        }
      } catch (error) {
        console.error('获取测试邮件信息失败:', error);
      }
    };
    
    fetchTestEmailsInfo();
  }, []);

  // 开始解析
  const startParsing = useCallback(async () => {
    if (!testEmailsInfo || testEmailsInfo.count === 0) return;

    setProcessing({
      status: "processing",
      progress: 0,
      currentFile: "",
      results: [],
      errors: []
    });

    try {
      console.log(`📧 开始解析 ${testEmailsInfo.count} 个邮件文件，AI处理: ${enableAI}`);

      const response = await fetch('/api/email-parser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enableAI
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      
      console.log('✅ 解析完成:', result);

      setProcessing({
        status: "success",
        progress: 100,
        currentFile: "",
        results: result.results || [],
        errors: result.errors || []
      });

    } catch (error) {
      console.error('❌ 解析失败:', error);
      setProcessing(prev => ({
        ...prev,
        status: "failed",
        errors: [...prev.errors, error instanceof Error ? error.message : "解析失败"]
      }));
    }
  }, [testEmailsInfo, enableAI]);

  // 导出 CSV
  const exportCSV = useCallback(() => {
    const resultsToExport = selectedResults.size > 0 
      ? processing.results.filter((_, index) => selectedResults.has(index))
      : processing.results;

    if (resultsToExport.length === 0) return;

    const csvHeaders = "邮件文件名,项目名称,联盟客名称,联盟客邮箱,沟通阶段,解析状态,失败原因,邮件主题,邮件日期\n";
    
    const csvContent = resultsToExport.map(result => {
      const stageName = getStageDisplayName(result.communicationStage);
      return [
        result.filename || "未知文件",
        result.projectName || "未识别",
        result.partnerName || "未识别", 
        result.partnerEmail || "未识别",
        stageName,
        result.success ? "解析成功" : "解析失败",
        result.errorReason || "-",
        result.emailSubject.replace(/"/g, '""'), // 转义CSV中的引号
        result.emailDate || "-"
      ].map(field => `"${field}"`).join(",");
    }).join("\n");

    const csvData = csvHeaders + csvContent;
    const blob = new Blob(["\ufeff" + csvData], { type: "text/csv;charset=utf-8;" }); // 添加BOM
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `邮件解析结果_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [processing.results, selectedResults]);

  // 获取阶段显示名称
  const getStageDisplayName = (stage: string | null) => {
    const stageMap: Record<string, string> = {
      "initial-inquiry": "前置了解",
      "proposal-discussion": "方案沟通", 
      "partnership-confirmed": "确认合作",
      "after-service": "售后服务"
    };
    return stage ? stageMap[stage] || stage : "未识别";
  };

  // 切换结果选择
  const toggleResultSelection = (index: number) => {
    setSelectedResults(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedResults.size === processing.results.length) {
      setSelectedResults(new Set());
    } else {
      setSelectedResults(new Set(processing.results.map((_, index) => index)));
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* 页面标题 */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">邮件解析工具</h1>
        <p className="text-muted-foreground">
          批量解析联盟营销邮件，提取项目名称、联盟客信息和沟通阶段
        </p>
      </div>

      {/* 邮件文件信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Test-emails 文件夹
          </CardTitle>
          <CardDescription>
            自动读取 test-emails 文件夹中的邮件文件进行解析
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {testEmailsInfo ? (
            <>
              {/* 邮件文件统计 */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <div className="text-sm font-medium">找到的邮件文件</div>
                  <div className="text-2xl font-bold text-primary">{testEmailsInfo.count}</div>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>

              {/* 文件列表预览 */}
              {testEmailsInfo.files.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">文件列表预览</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1 border rounded p-2">
                    {testEmailsInfo.files.slice(0, 10).map((filename, index) => (
                      <div key={index} className="text-xs font-mono p-1 bg-muted/30 rounded">
                        {filename}
                      </div>
                    ))}
                    {testEmailsInfo.files.length > 10 && (
                      <div className="text-xs text-muted-foreground text-center py-1">
                        ... 还有 {testEmailsInfo.files.length - 10} 个文件
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Separator />

              {/* 解析选项 */}
              <div className="space-y-4">
                <h4 className="font-medium">解析选项</h4>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enable-ai"
                    checked={enableAI}
                    onCheckedChange={(checked) => setEnableAI(checked === true)}
                  />
                  <label htmlFor="enable-ai" className="text-sm">
                    启用 AI 辅助解析 (提取联盟客姓名和识别沟通阶段)
                  </label>
                </div>
                <div className="text-xs text-muted-foreground">
                  • 规则匹配：从邮件头部和内容提取项目名称和联盟客邮箱<br/>
                  • AI 辅助：智能识别联盟客姓名和当前沟通阶段
                </div>
              </div>

              {/* 开始解析按钮 */}
              <Button 
                onClick={startParsing}
                disabled={processing.status === "processing" || testEmailsInfo.count === 0}
                className="w-full"
              >
                {processing.status === "processing" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    解析中...
                  </>
                ) : (
                  <>
                    开始解析 ({testEmailsInfo.count} 个文件)
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              正在扫描 test-emails 文件夹...
            </div>
          )}
        </CardContent>
      </Card>

      {/* 解析进度 */}
      {processing.status === "processing" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              解析进度
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={processing.progress} className="w-full" />
            <p className="text-sm text-muted-foreground">
              正在处理邮件文件，请稍候...
            </p>
          </CardContent>
        </Card>
      )}

      {/* 解析结果 */}
      {processing.results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                解析结果
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAll}
                >
                  {selectedResults.size === processing.results.length ? "取消全选" : "全选"}
                </Button>
                <Button
                  onClick={exportCSV}
                  size="sm"
                  disabled={processing.results.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  导出 CSV {selectedResults.size > 0 && `(${selectedResults.size})`}
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              成功解析 {processing.results.filter(r => r.success).length} / {processing.results.length} 个邮件
              {processing.errors.length > 0 && ` (${processing.errors.length} 个文件读取失败)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedResults.size === processing.results.length && processing.results.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>邮件文件名</TableHead>
                    <TableHead>项目名称</TableHead>
                    <TableHead>联盟客名称</TableHead>
                    <TableHead>联盟客邮箱</TableHead>
                    <TableHead>沟通阶段</TableHead>
                    <TableHead>解析状态</TableHead>
                    <TableHead>置信度</TableHead>
                    <TableHead>失败原因</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processing.results.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Checkbox
                          checked={selectedResults.has(index)}
                          onCheckedChange={() => toggleResultSelection(index)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs max-w-48">
                        <span className="truncate block" title={result.filename}>
                          {result.filename}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {result.projectName || (
                          <span className="text-muted-foreground">未识别</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {result.partnerName || (
                          <span className="text-muted-foreground">未识别</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {result.partnerEmail || (
                          <span className="text-muted-foreground">未识别</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {getStageDisplayName(result.communicationStage)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {result.success ? (
                          <Badge variant="default" className="text-xs">解析成功</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">解析失败</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          {(result.confidence * 100).toFixed(0)}%
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <span className="text-muted-foreground text-xs truncate block">
                          {result.errorReason || "-"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 错误信息 */}
      {processing.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p>解析过程中出现以下错误：</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {processing.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
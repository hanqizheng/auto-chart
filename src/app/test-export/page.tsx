"use client";

import { useState, useRef } from "react";
import { Download, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EnhancedChart } from "@/components/charts/enhanced-chart";
import { SimpleChart } from "@/components/charts/simple-chart";
import { useSimpleExport } from "@/hooks/use-simple-export";
import { mockTestData } from "@/lib/mock-chart-data";
import { ChartType, SimpleChartType } from "@/types/chart";

export default function TestExportPage() {
  const { isExporting, error, exportChart } = useSimpleExport();
  const [lastExported, setLastExported] = useState<string>("");

  const handleExport = async (element: HTMLElement, filename: string) => {
    try {
      console.log(`🎯 [TestPage] 开始导出: ${filename}`);
      await exportChart(element, filename);
      setLastExported(filename);
      console.log(`✅ [TestPage] 导出成功: ${filename}`);
    } catch (error) {
      console.error(`❌ [TestPage] 导出失败 ${filename}:`, error);
    }
  };

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">图表导出测试页面</h1>
        <p className="text-muted-foreground">
          使用 Mock 数据测试各种图表类型的导出功能，避免频繁调用 AI API
        </p>

        {/* 全局状态显示 */}
        {error && (
          <Alert className="mt-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>导出失败: {error}</AlertDescription>
          </Alert>
        )}

        {lastExported && !isExporting && (
          <Alert className="mt-4">
            <Download className="h-4 w-4" />
            <AlertDescription>✅ 成功导出: {lastExported}</AlertDescription>
          </Alert>
        )}
      </div>

      <Tabs defaultValue="enhanced" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="enhanced">增强图表 (EnhancedChart)</TabsTrigger>
          <TabsTrigger value="simple">简单图表 (SimpleChart)</TabsTrigger>
        </TabsList>

        <TabsContent value="enhanced" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* 柱状图 */}
            <TestChartCard
              title="柱状图测试"
              description="月度销售数据柱状图"
              filename="月度销售分析.png"
              onExport={handleExport}
              isExporting={isExporting}
            >
              <EnhancedChart
                type="bar"
                data={mockTestData.enhanced.bar.data}
                config={mockTestData.enhanced.bar.config}
                title="月度销售分析"
                description="2024年上半年销售、利润、成本对比"
              />
            </TestChartCard>

            {/* 折线图 */}
            <TestChartCard
              title="折线图测试"
              description="一周访问数据趋势"
              filename="网站访问趋势.png"
              onExport={handleExport}
              isExporting={isExporting}
            >
              <EnhancedChart
                type="line"
                data={mockTestData.enhanced.line.data}
                config={mockTestData.enhanced.line.config}
                title="网站访问趋势"
                description="过去一周的访问量、转化率、点击量变化"
              />
            </TestChartCard>

            {/* 面积图 */}
            <TestChartCard
              title="面积图测试"
              description="季度财务数据"
              filename="季度财务报告.png"
              onExport={handleExport}
              isExporting={isExporting}
            >
              <EnhancedChart
                type="area"
                data={mockTestData.enhanced.area.data}
                config={mockTestData.enhanced.area.config}
                title="季度财务报告"
                description="2024年各季度收入、支出、净利润情况"
                stacked={true}
              />
            </TestChartCard>

            {/* 饼图 */}
            <TestChartCard
              title="饼图测试"
              description="设备访问占比"
              filename="访问设备分布.png"
              onExport={handleExport}
              isExporting={isExporting}
            >
              <EnhancedChart
                type="pie"
                data={mockTestData.enhanced.pie.data}
                config={mockTestData.enhanced.pie.config}
                title="访问设备分布"
                description="不同设备类型的访问占比统计"
                showPercentage={true}
                showLegend={true}
              />
            </TestChartCard>
          </div>
        </TabsContent>

        <TabsContent value="simple" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Simple 柱状图 */}
            <TestChartCard
              title="简单柱状图测试"
              description="产品销售数据"
              filename="产品销售排行.png"
              onExport={handleExport}
              isExporting={isExporting}
            >
              <SimpleChart
                type="bar"
                data={mockTestData.simple.bar.data}
                config={mockTestData.simple.bar.config}
                title="产品销售排行"
                showExportButton={false}
              />
            </TestChartCard>

            {/* Simple 折线图 */}
            <TestChartCard
              title="简单折线图测试"
              description="温湿度监测数据"
              filename="温湿度监测.png"
              onExport={handleExport}
              isExporting={isExporting}
            >
              <SimpleChart
                type="line"
                data={mockTestData.simple.line.data}
                config={mockTestData.simple.line.config}
                title="温湿度监测"
                showExportButton={false}
              />
            </TestChartCard>
          </div>
        </TabsContent>
      </Tabs>

      {/* 快速测试说明 */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            快速测试指南
          </CardTitle>
          <CardDescription>如何使用这个测试页面验证导出功能</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>1. 选择图表类型</strong>：在上方标签页中选择要测试的图表类型
          </p>
          <p>
            <strong>2. 点击导出按钮</strong>：每个图表右上角都有导出按钮
          </p>
          <p>
            <strong>3. 检查导出结果</strong>：查看导出的 PNG 文件是否包含完整的图表内容
          </p>
          <p>
            <strong>4. 查看控制台日志</strong>：打开浏览器开发者工具查看详细的导出日志
          </p>
          <p className="text-muted-foreground mt-4">
            💡 提示：这些都是预设的 Mock 数据，可以快速测试而无需调用 AI API
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// 测试图表卡片组件
function TestChartCard({
  title,
  description,
  filename,
  onExport,
  isExporting,
  children,
}: {
  title: string;
  description: string;
  filename: string;
  onExport: (element: HTMLElement, filename: string) => Promise<void>;
  isExporting: boolean;
  children: React.ReactNode;
}) {
  const chartRef = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    if (chartRef.current) {
      await onExport(chartRef.current, filename);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                导出中...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                导出 PNG
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div ref={chartRef} className="min-h-[300px]">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

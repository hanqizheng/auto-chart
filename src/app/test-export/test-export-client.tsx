"use client";

import { useState, useRef } from "react";
import { Download, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EnhancedChart } from "@/components/charts/enhanced-chart";
import { ChartThemeProvider } from "@/contexts/chart-theme-context";
import { SimpleChart } from "@/components/charts/simple-chart";
import { useSimpleExport } from "@/hooks/use-simple-export";
import { mockTestData } from "@/lib/mock-chart-data";

export function TestExportClientPage() {
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
              <ChartThemeProvider
                chartType="bar"
                chartData={mockTestData.enhanced.bar.data}
                chartConfig={mockTestData.enhanced.bar.config}
              >
                <EnhancedChart
                  type="bar"
                  data={mockTestData.enhanced.bar.data}
                  config={mockTestData.enhanced.bar.config}
                  title="月度销售分析"
                  description="2024年上半年销售、利润、成本对比"
                />
              </ChartThemeProvider>
            </TestChartCard>

            {/* 折线图 */}
            <TestChartCard
              title="折线图测试"
              description="一周访问数据趋势"
              filename="网站访问趋势.png"
              onExport={handleExport}
              isExporting={isExporting}
            >
              <ChartThemeProvider
                chartType="line"
                chartData={mockTestData.enhanced.line.data}
                chartConfig={mockTestData.enhanced.line.config}
              >
                <EnhancedChart
                  type="line"
                  data={mockTestData.enhanced.line.data}
                  config={mockTestData.enhanced.line.config}
                  title="网站访问趋势"
                  description="过去一周的访问量、转化率、点击量变化"
                />
              </ChartThemeProvider>
            </TestChartCard>

            {/* 面积图 */}
            <TestChartCard
              title="面积图测试"
              description="季度财务数据"
              filename="季度财务报告.png"
              onExport={handleExport}
              isExporting={isExporting}
            >
              <ChartThemeProvider
                chartType="area"
                chartData={mockTestData.enhanced.area.data}
                chartConfig={mockTestData.enhanced.area.config}
              >
                <EnhancedChart
                  type="area"
                  data={mockTestData.enhanced.area.data}
                  config={mockTestData.enhanced.area.config}
                  title="季度财务报告"
                  description="2024年各季度收入、支出、净利润情况"
                  stacked={true}
                />
              </ChartThemeProvider>
            </TestChartCard>

            {/* 饼图 */}
            <TestChartCard
              title="饼图测试"
              description="设备访问占比"
              filename="访问设备分布.png"
              onExport={handleExport}
              isExporting={isExporting}
            >
              <ChartThemeProvider
                chartType="pie"
                chartData={mockTestData.enhanced.pie.data}
                chartConfig={mockTestData.enhanced.pie.config}
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
              </ChartThemeProvider>
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
          <CardTitle>快速测试指南</CardTitle>
          <CardDescription>使用以下步骤快速验证导出功能</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal space-y-2 pl-6">
            <li>选择一个图表，点击预览区域右上角的导出按钮</li>
            <li>等待导出完成，查看浏览器下载记录中的 PNG 文件</li>
            <li>重新点击导出按钮验证多次导出是否正常</li>
            <li>切换到 SimpleChart 标签页测试基础图表导出</li>
          </ol>

          <Alert>
            <RefreshCw className="h-4 w-4" />
            <AlertDescription>
              如需重置状态，请刷新页面。此页面仅用于本地开发和测试环境。
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

interface TestChartCardProps {
  title: string;
  description: string;
  filename: string;
  isExporting: boolean;
  onExport: (element: HTMLElement, filename: string) => Promise<void>;
  children: React.ReactNode;
}

function TestChartCard({
  title,
  description,
  filename,
  isExporting,
  onExport,
  children,
}: TestChartCardProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    if (!chartRef.current) return;
    await onExport(chartRef.current, filename);
  };

  return (
    <Card ref={chartRef} className="relative">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? "导出中..." : "导出 PNG"}
        </Button>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default TestExportClientPage;

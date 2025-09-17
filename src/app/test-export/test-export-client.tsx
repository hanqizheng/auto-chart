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
        <h1 className="mb-2 text-3xl font-bold">Chart Export Test Page</h1>
        <p className="text-muted-foreground">
          Test various chart type export functions using Mock data to avoid frequent AI API calls
        </p>

        {/* 全局状态显示 */}
        {error && (
          <Alert className="mt-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Export failed: {error}</AlertDescription>
          </Alert>
        )}

        {lastExported && !isExporting && (
          <Alert className="mt-4">
            <Download className="h-4 w-4" />
            <AlertDescription>✅ Successfully exported: {lastExported}</AlertDescription>
          </Alert>
        )}
      </div>

      <Tabs defaultValue="enhanced" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="enhanced">Enhanced Charts (EnhancedChart)</TabsTrigger>
          <TabsTrigger value="simple">Simple Charts (SimpleChart)</TabsTrigger>
        </TabsList>

        <TabsContent value="enhanced" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* 柱状图 */}
            <TestChartCard
              title="Bar Chart Test"
              description="Monthly sales data bar chart"
              filename="Monthly Sales Analysis.png"
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
                  title="Monthly Sales Analysis"
                  description="2024 H1 sales, profit, cost comparison"
                />
              </ChartThemeProvider>
            </TestChartCard>

            {/* 折线图 */}
            <TestChartCard
              title="Line Chart Test"
              description="One week access data trend"
              filename="Website Access Trend.png"
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
                  title="Website Access Trend"
                  description="Changes in visits, conversion rate, clicks over the past week"
                />
              </ChartThemeProvider>
            </TestChartCard>

            {/* 面积图 */}
            <TestChartCard
              title="Area Chart Test"
              description="Quarterly financial data"
              filename="Quarterly Financial Report.png"
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
                  title="Quarterly Financial Report"
                  description="2024 quarterly income, expense, and net profit situation"
                  stacked={true}
                />
              </ChartThemeProvider>
            </TestChartCard>

            {/* 饼图 */}
            <TestChartCard
              title="Pie Chart Test"
              description="Device access proportion"
              filename="Device Access Distribution.png"
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
                  title="Device Access Distribution"
                  description="Access proportion statistics for different device types"
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
              title="Simple Bar Chart Test"
              description="Product sales data"
              filename="Product Sales Ranking.png"
              onExport={handleExport}
              isExporting={isExporting}
            >
              <SimpleChart
                type="bar"
                data={mockTestData.simple.bar.data}
                config={mockTestData.simple.bar.config}
                title="Product Sales Ranking"
                showExportButton={false}
              />
            </TestChartCard>

            {/* Simple 折线图 */}
            <TestChartCard
              title="Simple Line Chart Test"
              description="Temperature and humidity monitoring data"
              filename="Temperature and Humidity Monitoring.png"
              onExport={handleExport}
              isExporting={isExporting}
            >
              <SimpleChart
                type="line"
                data={mockTestData.simple.line.data}
                config={mockTestData.simple.line.config}
                title="Temperature and Humidity Monitoring"
                showExportButton={false}
              />
            </TestChartCard>
          </div>
        </TabsContent>
      </Tabs>

      {/* 快速测试说明 */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Quick Test Guide</CardTitle>
          <CardDescription>
            Use the following steps to quickly verify export functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal space-y-2 pl-6">
            <li>
              Select a chart, click the export button in the top right corner of the preview area
            </li>
            <li>
              Wait for the export to complete, check the PNG file in the browser download history
            </li>
            <li>Click the export button again to verify that multiple exports work properly</li>
            <li>Switch to the SimpleChart tab to test basic chart export</li>
          </ol>

          <Alert>
            <RefreshCw className="h-4 w-4" />
            <AlertDescription>
              To reset the state, please refresh the page. This page is only for local development
              and testing environment.
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
          {isExporting ? "Exporting..." : "Export PNG"}
        </Button>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default TestExportClientPage;

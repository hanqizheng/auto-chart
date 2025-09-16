"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { BarChart, TrendingUp, Sparkles, FileSpreadsheet, ChevronDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewChatInput } from "@/components/chat/new-chat-input";
import { FileAttachment, SerializableChatSession, AutoTriggerConfig } from "@/types";
import { MESSAGE_TYPES, MESSAGE_STATUS, USER_MESSAGE_SUBTYPES } from "@/constants/message";
import { useSecurityValidation } from "@/lib/security";
import { useToast } from "@/components/ui/use-toast";
import { TEMP_STORAGE_KEYS } from "@/lib/session-storage";
import { fileToBase64 } from "@/lib/session-serializer";
import { v4 as uuidv4 } from "uuid";
import { DEMO_SESSION_LIST, getDemoSession } from "@/data/demo-sessions";
import { ThemeToggle } from "@/components/theme-toggle";

export default function HomePage() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const section1Ref = useRef<HTMLDivElement>(null);
  const section2Ref = useRef<HTMLDivElement>(null);
  const section3Ref = useRef<HTMLDivElement>(null);
  const section4Ref = useRef<HTMLDivElement>(null);

  // 安全验证hook
  const { validateRequest } = useSecurityValidation();
  const { toast } = useToast();

  // 监听滚动状态
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 处理输入提交
  const handleMessageSubmit = async (message: string, files: FileAttachment[]) => {
    try {
      // 安全验证
      console.log("🔐 [Homepage Security] 开始安全验证:", { 
        messageLength: message.length, 
        fileCount: files.length 
      });

      const securityResult = await validateRequest(message, files);
      
      if (!securityResult.isAllowed) {
        // 显示安全限制提示
        let toastMessage = securityResult.reason || '请求被安全系统阻止';
        let toastDescription = '';
        
        if (securityResult.retryAfter) {
          const minutes = Math.ceil(securityResult.retryAfter / 60);
          toastDescription = `请等待 ${minutes} 分钟后重试`;
        }
        
        if (securityResult.requiresCaptcha) {
          toastDescription = '检测到异常活动，建议稍后再试或联系支持';
        }

        toast({
          title: "🔒 安全限制",
          description: `${toastMessage}${toastDescription ? '\n' + toastDescription : ''}`,
          variant: "destructive",
          duration: 5000,
        });

        console.warn("🚨 [Homepage Security] 请求被阻止:", securityResult);
        return;
      }

      console.log("✅ [Homepage Security] 安全验证通过");
      console.log("🏠 [Homepage] 开始构造自动触发会话");

      // 构造完整的可序列化会话数据结构
      const sessionId = uuidv4();
      const messageId = uuidv4();
      
      // 处理文件附件序列化
      const serializedAttachments = [];
      if (files.length > 0) {
        console.log("📁 [Homepage] 序列化文件附件:", files.length);
        
        for (const file of files) {
          try {
            // 小文件转为Base64，大文件标记为需要IndexedDB存储
            const serializedFile: any = {
              id: file.id,
              name: file.name,
              type: file.type,
              size: file.size,
              uploadedAt: file.uploadedAt,
              storageType: file.size <= 1024 * 1024 ? 'base64' : 'indexeddb', // 1MB阈值
            };
            
            if (file.size <= 1024 * 1024) {
              // 小文件直接转为Base64
              serializedFile.dataUrl = await fileToBase64(file.file);
              console.log(`✅ [Homepage] 小文件 ${file.name} 转为Base64`);
            } else {
              // 大文件使用引用
              serializedFile.storageKey = `homepage_files/${file.id}`;
              console.log(`🗃️ [Homepage] 大文件 ${file.name} 使用引用存储`);
              // TODO: 存储到 IndexedDB
            }
            
            serializedAttachments.push(serializedFile);
          } catch (error) {
            console.error(`❌ [Homepage] 文件序列化失败 ${file.name}:`, error);
          }
        }
      }
      
      // 创建自动触发配置
      const autoTriggerConfig: AutoTriggerConfig = {
        enabled: true,
        type: 'ai_processing',
        triggerMessage: messageId,
        expectedFlow: [
          'thinking',
          'data_analysis',
          'chart_type_detection', 
          'chart_generation',
          'image_export'
        ]
      };
      
      // 构造可序列化的会话数据
      const sessionData: SerializableChatSession = {
        id: sessionId,
        title: undefined, // 稍后自动生成
        version: "1.0",
        source: "homepage",
        messages: [
          {
            id: messageId,
            type: MESSAGE_TYPES.USER,
            content: {
              text: message.trim(),
              subtype: files.length > 0 
                ? (message.trim() ? USER_MESSAGE_SUBTYPES.MIXED : USER_MESSAGE_SUBTYPES.FILE_UPLOAD) 
                : USER_MESSAGE_SUBTYPES.TEXT,
              attachments: serializedAttachments.length > 0 ? serializedAttachments as any : undefined,
            },
            timestamp: new Date(),
            status: MESSAGE_STATUS.SENT,
          }
        ],
        createdAt: new Date(),
        lastActivity: new Date(),
        
        // 自动触发配置
        _autoTrigger: autoTriggerConfig,
        
        // 标记为待处理状态
        _pendingProcessing: true,
        
        // 存储信息
        _storage: {
          totalFiles: files.length,
          totalCharts: 0,
          storageTypes: files.length > 0 ? ['base64', 'indexeddb'] : [],
          indexeddbKeys: serializedAttachments
            .filter((f: any) => f.storageType === 'indexeddb')
            .map((f: any) => f.storageKey)
            .filter(Boolean),
        },
      };
      
      console.log("📦 [Homepage] 会话数据构造完成:", {
        sessionId,
        messageId,
        hasFiles: files.length > 0,
        autoTriggerEnabled: autoTriggerConfig.enabled,
        attachmentsCount: serializedAttachments.length,
      });
      
      // 存储到临时存储
      localStorage.setItem(TEMP_STORAGE_KEYS.PENDING_SESSION, JSON.stringify(sessionData));
      
      // 跳转到 dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("❌ [Homepage Security] 安全验证失败:", error);
      toast({
        title: "❌ 处理失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    }
  };

  // 滚动到指定 section
  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  // 处理Demo点击
  const handleDemoClick = (demoId: string) => {
    try {
      const demoSession = getDemoSession(demoId);
      if (!demoSession) {
        toast({
          title: "⚠️ Demo不存在",
          description: "请选择其他Demo或使用手动输入",
          variant: "destructive",
        });
        return;
      }
      
      console.log("🎭 [Homepage] 启动Demo:", demoId);
      
      // 存储Demo会话数据
      localStorage.setItem(TEMP_STORAGE_KEYS.DEMO_SESSION, JSON.stringify(demoSession));
      
      // 跳转到Dashboard并携带Demo参数
      router.push(`/dashboard?demo=${demoId}`);
    } catch (error) {
      console.error("❌ [Homepage] Demo启动失败:", error);
      toast({
        title: "❌ Demo加载失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-background overflow-x-hidden">
      {/* 固定导航头部 */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-background/95 backdrop-blur border-b border-border/50" : "bg-transparent"
      }`}>
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-3">
            <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-md">
              <BarChart className="text-primary-foreground h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold">Auto Chart</h1>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => scrollToSection(section2Ref)}>
              样例展示
            </Button>
            <Button variant="outline" size="sm" onClick={() => scrollToSection(section1Ref)}>
              开始使用
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* 第一个 Section：输入框和标题 */}
      <section ref={section1Ref} className="relative flex min-h-screen items-center justify-center px-6 py-16">
        <div className="container mx-auto max-w-4xl">
          <div className="space-y-12 text-center">
            {/* Hero 内容 */}
            <div className="space-y-8">
              <div className="flex justify-center space-x-4 mb-8">
                <div className="bg-primary/10 rounded-full p-4">
                  <Sparkles className="text-primary h-8 w-8" />
                </div>
                <div className="bg-primary/10 rounded-full p-4">
                  <TrendingUp className="text-primary h-8 w-8" />
                </div>
                <div className="bg-primary/10 rounded-full p-4">
                  <FileSpreadsheet className="text-primary h-8 w-8" />
                </div>
              </div>
              
              <div className="space-y-6">
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                  AI 驱动的
                  <br />
                  <span className="from-primary to-primary/60 bg-gradient-to-r bg-clip-text text-transparent">
                    图表生成器
                  </span>
                </h1>
                
                <p className="text-muted-foreground mx-auto max-w-2xl text-lg md:text-xl leading-relaxed">
                  用自然语言描述需求，或上传数据文件，AI 立即为您生成专业的可视化图表
                </p>
              </div>
            </div>
            
            {/* 输入框区域 */}
            <div className="mx-auto max-w-2xl">
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">现在就开始创建您的图表</h3>
                <p className="text-muted-foreground text-sm">
                  描述您想要的图表类型和数据，或者上传 Excel 文件
                </p>
              </div>
              
              <div className="bg-card/50 backdrop-blur border rounded-2xl p-2">
                <NewChatInput
                  onSendMessage={handleMessageSubmit}
                  placeholder="例如：生成一个显示2023年各月份销售额的柱状图，或上传您的数据文件..."
                  className="border-0 bg-transparent p-2"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* 下滑提示 */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex flex-col items-center space-y-1 text-muted-foreground hover:text-foreground"
            onClick={() => scrollToSection(section2Ref)}
          >
            <span className="text-xs">查看样例</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* 第二个 Section：Demo展示 */}
      <section ref={section2Ref} className="relative flex min-h-screen items-center justify-center px-6 py-16 bg-muted/20">
        <div className="container mx-auto max-w-6xl">
          <div className="space-y-12 text-center">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold">功能演示</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                体验AI图表生成的强大功能，点击下方Demo立即查看效果
              </p>
            </div>
            
            {/* Demo展示卡片 */}
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              {DEMO_SESSION_LIST.map((demo) => (
                <div key={demo.id} className="bg-card border rounded-2xl p-6 hover:shadow-lg transition-shadow">
                  <div className="space-y-4">
                    {/* Demo图标 */}
                    <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                      {demo.chartType === 'line' && <TrendingUp className="text-primary h-6 w-6" />}
                      {demo.chartType === 'pie' && <Sparkles className="text-primary h-6 w-6" />}
                      {demo.chartType === 'bar' && <BarChart className="text-primary h-6 w-6" />}
                    </div>
                    
                    {/* Demo标题和描述 */}
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{demo.title}</h3>
                      <p className="text-muted-foreground text-sm mb-4">{demo.description}</p>
                    </div>
                    
                    {/* Demo特性 */}
                    <div className="flex flex-wrap gap-2 justify-center mb-4">
                      {demo.features.map((feature, index) => (
                        <span key={index} className="bg-muted px-2 py-1 rounded text-xs text-muted-foreground">
                          {feature}
                        </span>
                      ))}
                    </div>
                    
                    {/* Demo按钮 */}
                    <Button 
                      onClick={() => handleDemoClick(demo.id)}
                      className="w-full"
                      variant="outline"
                    >
                      体验Demo ({demo.estimatedTime})
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8">
              <Button 
                variant="ghost" 
                size="lg"
                onClick={() => scrollToSection(section3Ref)}
                className="group"
              >
                了解更多功能
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 第三个 Section：样例展示 2 */}
      <section ref={section3Ref} className="relative flex min-h-screen items-center justify-center px-6 py-16">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold">样例展示 2</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                这里将展示第二个图表生成样例和文件上传演示
              </p>
            </div>
            
            {/* 占位符 */}
            <div className="bg-card border rounded-2xl p-12 flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-4">
                <FileSpreadsheet className="h-16 w-16 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">文件上传样例展示区域</p>
                <p className="text-sm text-muted-foreground/60">即将上线</p>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => scrollToSection(section4Ref)}
              className="group"
            >
              查看最后一个样例 
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* 第四个 Section：样例展示 3 */}
      <section ref={section4Ref} className="relative flex min-h-screen items-center justify-center px-6 py-16 bg-muted/20">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-5xl font-bold">样例展示 3</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                这里将展示第三个图表生成样例和高级功能演示
              </p>
            </div>
            
            {/* 占位符 */}
            <div className="bg-card border rounded-2xl p-12 flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-4">
                <TrendingUp className="h-16 w-16 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">高级功能样例展示区域</p>
                <p className="text-sm text-muted-foreground/60">即将上线</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <Button 
                size="lg" 
                onClick={() => scrollToSection(section1Ref)}
                className="group px-8 py-3"
              >
                现在开始使用 
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <p className="text-muted-foreground text-sm">
                免费使用，立即生成专业图表
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* 品牌信息 */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-md">
                  <BarChart className="text-primary-foreground h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold">Auto Chart</h3>
              </div>
              <p className="text-muted-foreground max-w-md">
                AI 驱动的图表生成工具，让数据可视化变得简单高效。无需复杂操作，用自然语言即可生成专业图表。
              </p>
            </div>
            
            {/* 功能特色 */}
            <div className="space-y-3">
              <h4 className="font-semibold">核心功能</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>自然语言描述</li>
                <li>Excel 文件上传</li>
                <li>多种图表类型</li>
                <li>高质量导出</li>
              </ul>
            </div>
            
            {/* 技术支持 */}
            <div className="space-y-3">
              <h4 className="font-semibold">技术支持</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>AI 智能分析</li>
                <li>实时图表生成</li>
                <li>响应式设计</li>
                <li>数据安全保护</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Auto Chart. 基于 AI 技术的专业数据可视化工具。</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

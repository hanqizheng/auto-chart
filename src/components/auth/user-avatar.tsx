"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, User as UserType } from "@/hooks/use-auth";

interface UserAvatarProps {
  user: UserType;
  className?: string;
}

export function UserAvatar({ user, className = "" }: UserAvatarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useAuth();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    // 退出登录后返回首页
    router.push("/");
  };

  const getAvatarSrc = () => {
    if (user.avatar) {
      return user.avatar;
    }
    // 如果没有头像，使用 DiceBear 生成头像
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
  };

  const getProviderIcon = () => {
    switch (user.provider) {
      case "google":
        return "🟡";
      case "github":
        return "⚫";
      case "microsoft":
        return "🟦";
      default:
        return "👤";
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* 头像按钮 */}
      <Button
        variant="ghost"
        size="sm"
        className="relative h-10 w-10 rounded-full p-0"
        onClick={() => setIsOpen(!isOpen)}
      >
        <img
          src={getAvatarSrc()}
          alt={user.name}
          className="h-8 w-8 rounded-full object-cover"
          onError={e => {
            // 如果头像加载失败，显示默认头像
            const target = e.target as HTMLImageElement;
            target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`;
          }}
        />
        {/* 在线状态指示器 */}
        <div className="border-background absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 bg-green-500" />
      </Button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className="bg-background absolute top-12 right-0 z-50 w-64 rounded-lg border shadow-lg">
          {/* 用户信息头部 */}
          <div className="border-b p-4">
            <div className="flex items-center space-x-3">
              <img
                src={getAvatarSrc()}
                alt={user.name}
                className="h-12 w-12 rounded-full object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="text-muted-foreground truncate text-xs">{user.email}</p>
                <div className="mt-1 flex items-center">
                  <span className="mr-1 text-xs">{getProviderIcon()}</span>
                  <span className="text-muted-foreground text-xs capitalize">
                    {user.provider === "skip" ? "临时用户" : user.provider}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 菜单项 */}
          <div className="py-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-auto w-full justify-start px-4 py-2"
              onClick={() => {
                setIsOpen(false);
                // TODO: 实现个人资料页面
                console.log("打开个人资料");
              }}
            >
              <User className="mr-3 h-4 w-4" />
              <div className="text-left">
                <div className="text-sm">个人资料</div>
                <div className="text-muted-foreground text-xs">管理你的账户信息</div>
              </div>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-auto w-full justify-start px-4 py-2"
              onClick={() => {
                setIsOpen(false);
                // TODO: 实现设置页面
                console.log("打开设置");
              }}
            >
              <Settings className="mr-3 h-4 w-4" />
              <div className="text-left">
                <div className="text-sm">设置</div>
                <div className="text-muted-foreground text-xs">配置应用偏好</div>
              </div>
            </Button>
          </div>

          {/* 分割线 */}
          <div className="border-t" />

          {/* 退出登录 */}
          <div className="py-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-auto w-full justify-start px-4 py-2 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/10"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-4 w-4" />
              <div className="text-left">
                <div className="text-sm">退出登录</div>
                <div className="text-muted-foreground text-xs">安全退出当前账户</div>
              </div>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

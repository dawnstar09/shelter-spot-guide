'use client'

import { MapPin, Menu, User, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * 오량쉼터 헤더 컴포넌트
 * 네비게이션, 검색 기능, 사용자 접근을 제공합니다
 * 모바일 친화적인 반응형 디자인
 */
const Header = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { isLoggedIn, user, logout, isLoading } = useAuth();

  const navigation = [
    { href: "/", label: "홈", active: pathname === "/" },
    { href: "/about", label: "소개", active: pathname === "/about" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 로고와 제목 */}
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base sm:text-lg text-foreground">오량쉼터</span>
              <span className="text-xs text-muted-foreground hidden sm:block font-paperlogy-light">가까운 쉼터를 찾아보세요</span>
            </div>
          </Link>

          {/* 데스크톱 네비게이션 */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => (
              <Button
                key={item.href}
                variant={item.active ? "default" : "ghost"}
                size="sm"
                asChild
              >
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
            
            {/* 사용자 메뉴 */}
            {isLoading ? (
              <Button variant="ghost" size="sm" className="ml-2" disabled>
                <User className="w-4 h-4" />
              </Button>
            ) : isLoggedIn && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="ml-2 flex items-center space-x-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden lg:inline text-sm">{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/mypage" className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>마이페이지</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="flex items-center space-x-2 text-red-600">
                    <LogOut className="w-4 h-4" />
                    <span>로그아웃</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="sm" className="ml-2" asChild>
                <Link href="/login" className="flex items-center space-x-2">
                  <LogIn className="w-4 h-4" />
                  <span className="hidden lg:inline">로그인</span>
                </Link>
              </Button>
            )}
          </nav>

          {/* 모바일 메뉴 버튼 */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 sm:w-96">
                <div className="flex flex-col space-y-4 mt-8">
                  <div className="flex items-center space-x-2 pb-4 border-b">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-lg text-foreground">오량쉼터</span>
                      <span className="text-sm text-muted-foreground font-paperlogy-light">가까운 쉼터를 찾아보세요</span>
                    </div>
                  </div>

                  {/* 모바일 네비게이션 */}
                  <nav className="flex flex-col space-y-2">
                    {navigation.map((item) => (
                      <Button
                        key={item.href}
                        variant={item.active ? "default" : "ghost"}
                        size="lg"
                        asChild
                        className="justify-start text-left"
                        onClick={() => setIsOpen(false)}
                      >
                        <Link href={item.href}>{item.label}</Link>
                      </Button>
                    ))}
                  </nav>

                  {/* 모바일 사용자 메뉴 */}
                  <div className="pt-4 border-t">
                    {isLoading ? (
                      <Button variant="ghost" size="lg" className="w-full justify-start" disabled>
                        <User className="w-4 h-4 mr-2" />
                        로딩 중...
                      </Button>
                    ) : isLoggedIn && user ? (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback>
                              {user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">@{user.username}</div>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="lg" 
                          className="w-full justify-start"
                          asChild
                          onClick={() => setIsOpen(false)}
                        >
                          <Link href="/mypage">
                            <User className="w-4 h-4 mr-2" />
                            마이페이지
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="lg" 
                          className="w-full justify-start text-red-600"
                          onClick={() => {
                            logout();
                            setIsOpen(false);
                          }}
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          로그아웃
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Button 
                          variant="ghost" 
                          size="lg" 
                          className="w-full justify-start"
                          asChild
                          onClick={() => setIsOpen(false)}
                        >
                          <Link href="/login">
                            <LogIn className="w-4 h-4 mr-2" />
                            로그인
                          </Link>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="lg" 
                          className="w-full justify-start"
                          asChild
                          onClick={() => setIsOpen(false)}
                        >
                          <Link href="/signup">
                            <User className="w-4 h-4 mr-2" />
                            회원가입
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
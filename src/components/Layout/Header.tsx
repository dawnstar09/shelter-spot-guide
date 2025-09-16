'use client'

import { MapPin, Menu, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

/**
 * 오량쉼터 헤더 컴포넌트
 * 네비게이션, 검색 기능, 사용자 접근을 제공합니다
 * 모바일 친화적인 반응형 디자인
 */
const Header = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

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
            <Button variant="ghost" size="sm" className="ml-2">
              <User className="w-4 h-4" />
            </Button>
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
                    <Button variant="ghost" size="lg" className="w-full justify-start">
                      <User className="w-4 h-4 mr-2" />
                      사용자 메뉴
                    </Button>
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
'use client'

import { MapPin, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * 오량쉼터 헤더 컴포넌트
 * 네비게이션, 검색 기능, 사용자 접근을 제공합니다
 */
const Header = () => {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* 로고와 제목 */}
        <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
            <MapPin className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg text-foreground">오량쉼터</span>
            <span className="text-xs text-muted-foreground hidden sm:block font-paperlogy-light">가까운 쉼터를 찾아보세요</span>
          </div>
        </Link>

        {/* 네비게이션 */}
        <nav className="flex items-center space-x-1">
          <Button
            variant={pathname === "/" ? "default" : "ghost"}
            size="sm"
            asChild
          >
            <Link href="/">홈</Link>
          </Button>
          <Button
            variant={pathname === "/shelters" ? "default" : "ghost"}
            size="sm"
            asChild
          >
            <Link href="/shelters">쉼터</Link>
          </Button>
          <Button
            variant={pathname === "/about" ? "default" : "ghost"}
            size="sm"
            asChild
          >
            <Link href="/about">소개</Link>
          </Button>

          {/* 사용자 메뉴 */}
          <Button variant="ghost" size="sm" className="ml-2">
            <User className="w-4 h-4" />
          </Button>
        </nav>
      </div>

      {/* 모바일 검색창 */}
      <div className="md:hidden px-4 pb-3">
        <Input
          type="search"
          placeholder="쉼터 검색..."
          className="w-full"
        />
      </div>
    </header>
  );
};

export default Header;
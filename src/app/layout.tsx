'use client'

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import '@/index.css'

const queryClient = new QueryClient()

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <title>쉼터 스팟 가이드 - 가까운 쉼터 찾기</title>
        <meta name="description" content="실시간 혼잡도 데이터와 함께 근처 쉼터와 냉방센터를 찾아보세요. 무더운 날씨에 안전한 쉼터를 제공하는 종합 가이드입니다." />
        <meta name="keywords" content="쉼터, 무더위쉼터, 냉방센터, 실시간, 혼잡도" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="preload" href="/fonts/Paperlogy-7Bold.ttf" as="font" type="font/ttf" crossOrigin="" />
        <link rel="preload" href="/fonts/Paperlogy-2ExtraLight.ttf" as="font" type="font/ttf" crossOrigin="" />
        <script
          src={`https://apis.openapi.sk.com/tmap/jsv2?version=1&appKey=${process.env.NEXT_PUBLIC_TMAP_API_KEY}`}
          async={false}
        />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TooltipProvider>
              {children}
              
              <Toaster />
              <Sonner />
            </TooltipProvider>
          </AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  )
}

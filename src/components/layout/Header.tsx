'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* ロゴ */}
          <Link href="/" className="flex items-center space-x-2 font-bold text-xl">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg llmo-gradient">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-gradient">LLMO診断</span>
          </Link>

          {/* デスクトップナビゲーション */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              href="/" 
              className="text-foreground/80 hover:text-foreground transition-colors focus-ring rounded-sm px-2 py-1"
            >
              ホーム
            </Link>
            <Link 
              href="/diagnosis" 
              className="text-foreground/80 hover:text-foreground transition-colors focus-ring rounded-sm px-2 py-1"
            >
              診断開始
            </Link>
            <Link 
              href="/about" 
              className="text-foreground/80 hover:text-foreground transition-colors focus-ring rounded-sm px-2 py-1"
            >
              LLMOとは
            </Link>
            <Link 
              href="/examples" 
              className="text-foreground/80 hover:text-foreground transition-colors focus-ring rounded-sm px-2 py-1"
            >
              診断例
            </Link>
          </nav>

          {/* CTA ボタン */}
          <div className="hidden md:flex items-center space-x-4">
            <Button asChild className="llmo-gradient text-white hover:opacity-90">
              <Link href="/diagnosis">
                無料診断を開始
              </Link>
            </Button>
          </div>

          {/* モバイルメニューボタン */}
          <button
            className="md:hidden focus-ring rounded p-2"
            onClick={toggleMenu}
            aria-label={isMenuOpen ? 'メニューを閉じる' : 'メニューを開く'}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* モバイルメニュー */}
        {isMenuOpen && (
          <div className="md:hidden border-t py-4">
            <nav className="flex flex-col space-y-4">
              <Link 
                href="/" 
                className="text-foreground/80 hover:text-foreground transition-colors focus-ring rounded-sm px-2 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                ホーム
              </Link>
              <Link 
                href="/diagnosis" 
                className="text-foreground/80 hover:text-foreground transition-colors focus-ring rounded-sm px-2 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                診断開始
              </Link>
              <Link 
                href="/about" 
                className="text-foreground/80 hover:text-foreground transition-colors focus-ring rounded-sm px-2 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                LLMOとは
              </Link>
              <Link 
                href="/examples" 
                className="text-foreground/80 hover:text-foreground transition-colors focus-ring rounded-sm px-2 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                診断例
              </Link>
              <div className="pt-4 border-t">
                <Button asChild className="w-full llmo-gradient text-white hover:opacity-90">
                  <Link href="/diagnosis" onClick={() => setIsMenuOpen(false)}>
                    無料診断を開始
                  </Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
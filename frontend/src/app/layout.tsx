'use client'

import { useState, useEffect } from 'react'
import type { Metadata } from "next"
import localFont from "next/font/local"
import { useAccount, WagmiConfig } from 'wagmi'

import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

import {
  ResizablePanel,
  ResizableHandle,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"

import {
  Layout,
  LayoutDashboard,
  Package,
  Database,
  Settings,
  Users,
  Activity,
  HelpCircle,
  LogOut,
  Wallet,
} from "lucide-react"
import { ThemeProvider } from 'next-themes'
import { config } from 'process'

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
})

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
})

export const metadata: Metadata = {
  title: "AI Model Marketplace",
  description: "Confidential AI Model Exchange Platform",
}

interface NavItemProps {
  icon: React.ReactElement
  title: string
  isActive?: boolean
  isCollapsed: boolean
  onSelect: () => void
}

const NavItem = ({ icon, title, isActive, isCollapsed, onSelect }: NavItemProps) => {
  function cn(...classes: (string | boolean | undefined)[]): string {
    return classes.filter(Boolean).join(' ');
  }

  return (
    <Button
      className={cn(
        "w-full justify-start gap-2",
        isActive && "bg-muted",
        isCollapsed ? "px-2" : "px-4"
      )}
      onClick={onSelect}
    >
      {icon}
      {!isCollapsed && <span>{title}</span>}
    </Button>
  )
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeItem, setActiveItem] = useState('dashboard')
  const { address, isConnecting } = useAccount()

  const navItems = [
    { id: 'dashboard', icon: <LayoutDashboard className="h-4 w-4" />, title: 'Dashboard' },
    { id: 'models', icon: <Package className="h-4 w-4" />, title: 'Models' },
    { id: 'datasets', icon: <Database className="h-4 w-4" />, title: 'Datasets' },
    { id: 'compute', icon: <Activity className="h-4 w-4" />, title: 'Compute Jobs' },
    { id: 'users', icon: <Users className="h-4 w-4" />, title: 'Users' },
    { id: 'settings', icon: <Settings className="h-4 w-4" />, title: 'Settings' },
  ]

  function cn(...classes: (string | boolean | undefined)[]): string {
    return classes.filter(Boolean).join(' ');
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        geistSans.variable,
        geistMono.variable,
        'antialiased min-h-screen'
      )}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <WagmiConfig config={config}>
            <div className="h-screen w-full">
              <ResizablePanelGroup direction="horizontal">
                {/* Sidebar */}
                <ResizablePanel
                  defaultSize={20}
                  minSize={10}
                  maxSize={20}
                  collapsible={true}
                  collapsedSize={5}
                  onCollapse={() => setIsCollapsed(true)}
                  onExpand={() => setIsCollapsed(false)}
                  className="min-h-screen"
                >
                  <div className="flex h-full flex-col gap-4 p-4">
                    {/* Logo/Brand */}
                    <div className="flex items-center gap-2">
                      <Layout className="h-6 w-6" />
                      {!isCollapsed && (
                        <span className="font-semibold">AI Exchange</span>
                      )}
                    </div>

                    {/* Navigation */}
                    <ScrollArea className="flex-1">
                      <div className="space-y-2">
                        {navItems.map((item) => (
                          <NavItem
                            key={item.id}
                            icon={item.icon}
                            title={item.title}
                            isActive={activeItem === item.id}
                            isCollapsed={isCollapsed}
                            onSelect={() => setActiveItem(item.id)}
                          />
                        ))}
                      </div>
                    </ScrollArea>

                    {/* Bottom Actions */}
                    <div className="space-y-2">
                      {/* Wallet Connection */}
                      {address ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              className={cn(
                                "w-full justify-start gap-2",
                                isCollapsed && "px-2"
                              )}
                            >
                              <Wallet className="h-4 w-4" />
                              {!isCollapsed && (
                                <span className="truncate">
                                  {address.slice(0, 6)}...{address.slice(-4)}
                                </span>
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Wallet</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <LogOut className="h-4 w-4 mr-2" />
                              Disconnect
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <Button
                          className={cn(
                            "w-full justify-start gap-2",
                            isCollapsed && "px-2"
                          )}
                          disabled={isConnecting}
                        >
                          <Wallet className="h-4 w-4" />
                          {!isCollapsed && (
                            <span>
                              {isConnecting ? "Connecting..." : "Connect Wallet"}
                            </span>
                          )}
                        </Button>
                      )}

                      {/* Theme Toggle */}
                      {/* Replace this with the correct component or element */}
                      {/* Example: <ThemeToggle /> */}

                      {/* Help */}
                      <Button
                        className={cn(
                          "w-full justify-start gap-2",
                          isCollapsed && "px-2"
                        )}
                      >
                        <HelpCircle className="h-4 w-4" />
                        {!isCollapsed && <span>Help</span>}
                      </Button>
                    </div>
                  </div>
                </ResizablePanel>

                {/* Main Content */}
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={80}>
                  <main className="h-full overflow-auto bg-muted/5">
                    {children}
                  </main>
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>

            <Toaster />
          </WagmiConfig>
        </ThemeProvider>
      </body>
    </html>
  )
}
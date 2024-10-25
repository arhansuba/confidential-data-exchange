import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  LayoutDashboard,
  Database,
  Settings,
  HelpCircle,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
//import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive?: boolean;
}

const NavItem = ({ href, label, icon, isActive }: NavItemProps) => (
  <Link 
    href={href}
    className={cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
      isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
    )}
  >
    {icon}
    {label}
  </Link>
);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false);

  const navigation = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      href: '/marketplace',
      label: 'Marketplace',
      icon: <Database className="h-4 w-4" />,
    },
    {
      href: '/compute',
      label: 'Compute Jobs',
      icon: <Shield className="h-4 w-4" />,
    },
    {
      href: '/settings',
      label: 'Settings',
      icon: <Settings className="h-4 w-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Navigation */}
      <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
        <SheetTrigger asChild>
          <Button
            className="flex md:hidden items-center gap-2 p-2"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent className="w-64">
          <div className="flex flex-col h-full">
            <div className="space-y-4 py-4">
              <div className="px-3 py-2">
                <h2 className="mb-2 px-4 text-lg font-semibold">Navigation</h2>
                <div className="space-y-1">
                  {navigation.map((item) => (
                    <NavItem
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      isActive={pathname === item.href}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Navigation */}
      <div className="hidden md:flex h-screen">
        <div className="w-64 border-r bg-background px-3 py-4">
          <div className="flex h-full flex-col">
            <div className="space-y-4">
              <div className="px-3 py-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">AI Exchange</h2>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button>
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setTheme('light')}>
                        Light
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme('dark')}>
                        Dark
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTheme('system')}>
                        System
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-1">
                  {navigation.map((item) => (
                    <NavItem
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      isActive={pathname === item.href}
                    />
                  ))}
                </div>
              </div>
              <Separator />
              <div className="px-3 py-2">
                <h3 className="mb-2 px-4 text-sm font-semibold">Support</h3>
                <div className="space-y-1">
                  <NavItem
                    href="/help"
                    label="Documentation"
                    icon={<HelpCircle className="h-4 w-4" />}
                    isActive={pathname === '/help'}
                  />
                </div>
              </div>
            </div>
            <div className="mt-auto">
              <Separator />
              <div className="p-4">
                <Button
                  className="w-full justify-start"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Connected to Sapphire
                </Button>
              </div>
            </div>
          </div>
        </div>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function cn(arg0: string, arg1: string): string | undefined {
    throw new Error('Function not implemented.');
}

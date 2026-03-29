import { BurhanNewLogo } from "./BurhanNewLogo";
import { Button } from "./ui/button";
import { LayoutDashboard, Link2, User, HelpCircle, LogOut, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

type TabId = "dashboard" | "compliance" | "profile" | "help";

interface TopNavHeaderProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  userName: string;
  userEmail: string;
  onLogout: () => void;
}

const navItems = [
  { id: "dashboard" as TabId, label: "Dashboard", icon: LayoutDashboard },
  { id: "compliance" as TabId, label: "Evidence Compliance Management", icon: Link2 },
];

export function TopNavHeader({ activeTab, onTabChange, userName, userEmail, onLogout }: TopNavHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white shadow-sm">
      <div className="flex h-16 items-center px-8">
        {/* Logo - Far Left */}
        <div className="flex items-center gap-3">
          <BurhanNewLogo size="md" />
          <div className="h-8 w-px bg-gray-200" />
        </div>

        {/* Navigation Tabs - Left Aligned */}
        <nav className="ml-6 flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <Button
                key={item.id}
                variant="ghost"
                onClick={() => onTabChange(item.id)}
                className={`gap-2 px-4 transition-all ${
                  isActive
                    ? "bg-[#001F3F] text-white hover:bg-[#1E488F] hover:text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>

        {/* User Menu - Far Right */}
        <div className="ml-auto flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 hover:bg-gray-100">
                <div className="w-8 h-8 rounded-full bg-[#001F3F] text-white flex items-center justify-center">
                  <span className="text-sm">{userName.charAt(0)}</span>
                </div>
                <div className="text-left">
                  <p className="text-sm">{userName}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div>
                  <p className="text-sm">{userName}</p>
                  <p className="text-xs text-muted-foreground">{userEmail}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onTabChange("profile")} className="cursor-pointer">
                <User className="w-4 h-4 mr-2" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTabChange("help")} className="cursor-pointer">
                <HelpCircle className="w-4 h-4 mr-2" />
                Help & Support
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-red-600 cursor-pointer">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
import { useState } from "react";
import { LoginForm } from "./components/LoginForm";
import { SignupForm } from "./components/SignupForm";
import { Dashboard } from "./components/Dashboard";
import { EvidenceManagementNew } from "./components/EvidenceManagementNew";
import { ComplianceReport } from "./components/ComplianceReport";
import { ControlComplianceNew } from "./components/ControlComplianceNew";
import { UserProfile } from "./components/UserProfile";
import { HelpSupport } from "./components/HelpSupport";
import { ReportPreview } from "./components/ReportPreview";
import { BurhanNewLogo } from "./components/BurhanNewLogo";
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter } from "./components/ui/sidebar";
import { LayoutDashboard, FileUp, FileText, Link2, User, HelpCircle, LogOut } from "lucide-react";
import { Button } from "./components/ui/button";
import { Separator } from "./components/ui/separator";
import { Toaster } from "./components/ui/sonner";

type TabId = "dashboard" | "evidence" | "reports" | "compliance" | "profile" | "help";

export default function App() {
  const [showSignup, setShowSignup] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [userName] = useState("John Smith");

  if (!isLoggedIn && showSignup) {
    return (
      <SignupForm
        onSignup={() => {
          setIsLoggedIn(true);
          setShowSignup(false);
        }}
        onBackToLogin={() => setShowSignup(false)}
      />
    );
  }

  if (!isLoggedIn) {
    return (
      <LoginForm
        onLogin={() => setIsLoggedIn(true)}
        onSignup={() => setShowSignup(true)}
      />
    );
  }

  if (showReportPreview) {
    return <ReportPreview onBack={() => setShowReportPreview(false)} />;
  }

  const menuItems = [
    { id: "dashboard" as TabId, label: "Dashboard", icon: LayoutDashboard },
    { id: "evidence" as TabId, label: "Evidence Management", icon: FileUp },
    { id: "reports" as TabId, label: "Compliance Reports", icon: FileText },
    { id: "compliance" as TabId, label: "Control Compliance", icon: Link2 },
    { id: "profile" as TabId, label: "User Profile", icon: User },
    { id: "help" as TabId, label: "Help & Support", icon: HelpCircle },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard onGenerateReport={() => setShowReportPreview(true)} userName={userName} />;
      case "evidence":
        return <EvidenceManagementNew />;
      case "reports":
        return <ComplianceReport onPreviewReport={() => setShowReportPreview(true)} />;
      case "compliance":
        return <ControlComplianceNew />;
      case "profile":
        return <UserProfile />;
      case "help":
        return <HelpSupport />;
      default:
        return <Dashboard onGenerateReport={() => setShowReportPreview(true)} userName={userName} />;
    }
  };

  return (
    <>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <Sidebar>
            <SidebarHeader className="p-4">
              <div className="flex items-center justify-center">
                <BurhanNewLogo size="md" />
              </div>
            </SidebarHeader>
          
          <Separator />
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => setActiveTab(item.id)}
                        isActive={activeTab === item.id}
                        tooltip={item.label}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4">
            <div className="space-y-2">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">{userName}</p>
                <p className="text-xs text-muted-foreground">john.smith@example.com</p>
              </div>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setIsLoggedIn(false)}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 p-8 bg-muted/30">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </SidebarProvider>
    <Toaster />
  </>
  );
}
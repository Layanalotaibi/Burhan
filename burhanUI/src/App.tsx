import { useState } from "react";
import { LoginForm } from "./components/LoginForm";
import { SignupForm } from "./components/SignupForm";
import { Dashboard } from "./components/Dashboard";
import { ControlComplianceNew } from "./components/ControlComplianceNew";
import { UserProfile } from "./components/UserProfile";
import { HelpSupport } from "./components/HelpSupport";
import { ReportPreview } from "./components/ReportPreview";
import { TopNavHeader } from "./components/TopNavHeader";
import { Toaster } from "./components/ui/sonner";

type TabId = "dashboard" | "compliance" | "profile" | "help";

export default function App() {
  const [showSignup, setShowSignup] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [selectedControlId, setSelectedControlId] = useState<string | null>(null);

  const handleLogin = (user: { name: string; email: string; role: string }) => {
    setUserName(user.name);
    setUserEmail(user.email);
    setIsLoggedIn(true);
  };

  const handleNavigateToControl = (controlId: string) => {
    setSelectedControlId(controlId);
    setActiveTab("compliance");
  };

  if (!isLoggedIn && showSignup) {
    return (
      <SignupForm
        onSignup={(user) => {
          handleLogin(user);
          setShowSignup(false);
        }}
        onBackToLogin={() => setShowSignup(false)}
      />
    );
  }

  if (!isLoggedIn) {
    return (
      <LoginForm
        onLogin={handleLogin}
        onSignup={() => setShowSignup(true)}
      />
    );
  }

  if (showReportPreview) {
    return <ReportPreview onBack={() => setShowReportPreview(false)} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard onGenerateReport={() => setShowReportPreview(true)} userName={userName} onNavigateToControl={handleNavigateToControl} />;
      case "compliance":
        return <ControlComplianceNew selectedControlId={selectedControlId} onClearSelection={() => setSelectedControlId(null)} userName={userName} />;
      case "profile":
        return <UserProfile />;
      case "help":
        return <HelpSupport />;
      default:
        return <Dashboard onGenerateReport={() => setShowReportPreview(true)} userName={userName} onNavigateToControl={handleNavigateToControl} />;
    }
  };

  return (
    <>
      <div className="min-h-screen w-full bg-[#F6F7ED]">
        {/* Top Navigation Header */}
        <TopNavHeader
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userName={userName}
          userEmail={userEmail}
          onLogout={() => setIsLoggedIn(false)}
        />

        {/* Main Content */}
        <main className="p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
      <Toaster />
    </>
  );
}
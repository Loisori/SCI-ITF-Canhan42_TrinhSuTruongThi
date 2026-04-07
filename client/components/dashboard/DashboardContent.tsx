"use client";

import { useDashboard } from "@/context/DashboardContext";
import { UserProfile } from "@/types/user";
import Overview from "./views/Overview";
import WalletView from "./views/WalletView";
import MyPortfolio from "./views/MyPortfolio";
import MyProjects from "./views/MyProjects";
import SettingsView from "./views/SettingsView";

// Admin Views
import SystemOverview from "./views/admin/SystemOverview";
import ProjectApprovals from "./views/admin/ProjectApprovals";
import UserManagement from "./views/admin/UserManagement";

export default function DashboardContent({ profile, onUpdate }: { profile: UserProfile, onUpdate: () => void }) {
  const { activeView } = useDashboard();

  const renderView = () => {
    switch (activeView) {
      // Common & Investor/Owner Views
      case "overview":
        return <Overview profile={profile} />;
      case "wallet":
        return <WalletView profile={profile} />;
      case "portfolio":
        return <MyPortfolio profile={profile} />;
      case "my-projects":
        return <MyProjects profile={profile} />;
      case "settings":
        return <SettingsView profile={profile} onUpdate={onUpdate} />;

      // Admin specific views
      case "system-overview":
        return <SystemOverview />;
      case "project-approvals":
        return <ProjectApprovals />;
      case "user-management":
        return <UserManagement />;

      default:
        return <Overview profile={profile} />;
    }
  };

  return (
    <div className="w-full">
      {renderView()}
    </div>
  );
}

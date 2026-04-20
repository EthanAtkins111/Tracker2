import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Accounts from "@/pages/Accounts";
import AccountDetail from "@/pages/AccountDetail";
import Contacts from "@/pages/Contacts";
import FollowUps from "@/pages/FollowUps";
import Opportunities from "@/pages/Opportunities";
import UserManagement from "@/pages/UserManagement";
import ActivityReport from "@/pages/ActivityReport";
import Auth from "@/pages/Auth";
import PendingApproval from "@/pages/PendingApproval";
import Settings from "@/pages/Settings";
import Profile from "@/pages/Profile";
import Help from "@/pages/Help";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, loading, approved } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return <Auth />;
  if (!approved) return <PendingApproval />;

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/accounts/:id" element={<AccountDetail />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/follow-ups" element={<FollowUps />} />
        <Route path="/opportunities" element={<Opportunities />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/activity" element={<ActivityReport />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/help" element={<Help />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

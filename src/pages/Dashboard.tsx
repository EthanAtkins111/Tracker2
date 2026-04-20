import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SalesDashboard from "./SalesDashboard";
import SalesAdminDashboard from "./SalesAdminDashboard";
import ManagerDashboard from "./ManagerDashboard";
import RoleDashboard from "./RoleDashboard";

function NoRolePrompt() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
      <p className="text-muted-foreground text-sm">Your dashboard is ready — just set your role first.</p>
      <Button onClick={() => navigate('/profile')}>Set Role in Profile</Button>
    </div>
  );
}

export default function Dashboard() {
  const { role } = useAuth();

  if (role === 'Sales') return <SalesDashboard />;
  if (role === 'Sales Admin') return <SalesAdminDashboard />;
  if (role === 'Manager') return <ManagerDashboard />;
  if (role === 'Service' || role === 'Retail' || role === 'Technician') return <RoleDashboard />;
  return <NoRolePrompt />;
}

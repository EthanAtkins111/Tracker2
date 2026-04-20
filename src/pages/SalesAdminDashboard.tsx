import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "@/components/StatusBadges";
import { InteractionDialog } from "@/components/InteractionDialog";
import { useCrmData } from "@/hooks/use-crm-data";
import {
  fetchStoreProfiles,
  fetchMyAssignedRepIds,
  fetchFollowUpsByUserIds,
  assignRep,
  unassignRep,
} from "@/lib/supabase-store";
import { useAuth } from "@/contexts/AuthContext";
import { FollowUp, StoreProfile } from "@/lib/types";
import {
  Users, AlertTriangle, CalendarClock, Phone, LogOut, UserPlus, UserMinus, ChevronDown, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RepSection {
  profile: StoreProfile;
  overdue: FollowUp[];
  upcoming: FollowUp[];
}

export default function SalesAdminDashboard() {
  const { signOut } = useAuth();
  const { accounts, contacts, loading, refresh } = useCrmData();
  const navigate = useNavigate();

  const [allSalesReps, setAllSalesReps] = useState<StoreProfile[]>([]);
  const [assignedRepIds, setAssignedRepIds] = useState<string[]>([]);
  const [allFollowUps, setAllFollowUps] = useState<FollowUp[]>([]);
  const [showInteraction, setShowInteraction] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);

  const loadData = async () => {
    const profiles = await fetchStoreProfiles();
    const reps = profiles.filter(p => p.role === 'Sales');
    setAllSalesReps(reps);

    const repIds = await fetchMyAssignedRepIds();
    setAssignedRepIds(repIds);

    if (repIds.length > 0) {
      const fus = await fetchFollowUpsByUserIds(repIds);
      setAllFollowUps(fus.filter(f => f.status === 'Pending'));
    } else {
      setAllFollowUps([]);
    }
  };

  useEffect(() => { if (!loading) loadData(); }, [loading]);

  const handleSaved = () => { refresh(); loadData(); };

  const handleAssign = async (repId: string) => {
    setAssigning(repId);
    try {
      await assignRep(repId);
      setAssignedRepIds(prev => [...prev, repId]);
      const rep = allSalesReps.find(r => r.id === repId);
      // fetch that rep's follow-ups and add to state
      const fus = await fetchFollowUpsByUserIds([repId]);
      setAllFollowUps(prev => [...prev, ...fus.filter(f => f.status === 'Pending')]);
      toast.success(`${rep?.fullName ?? 'Rep'} assigned`);
    } catch {
      toast.error('Failed to assign rep');
    } finally {
      setAssigning(null);
    }
  };

  const handleUnassign = async (repId: string) => {
    setAssigning(repId);
    try {
      await unassignRep(repId);
      setAssignedRepIds(prev => prev.filter(id => id !== repId));
      setAllFollowUps(prev => prev.filter(f => f.userId !== repId));
      const rep = allSalesReps.find(r => r.id === repId);
      toast.success(`${rep?.fullName ?? 'Rep'} unassigned`);
    } catch {
      toast.error('Failed to unassign rep');
    } finally {
      setAssigning(null);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  // Build per-rep sections for assigned reps only
  const repSections = useMemo((): RepSection[] => {
    return assignedRepIds
      .map(repId => {
        const profile = allSalesReps.find(r => r.id === repId);
        if (!profile) return null;
        const repFUs = allFollowUps.filter(f => f.userId === repId);
        return {
          profile,
          overdue: repFUs.filter(f => f.dueDate <= today).sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
          upcoming: repFUs.filter(f => f.dueDate > today && f.dueDate <= nextWeek).sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
        };
      })
      .filter(Boolean) as RepSection[];
  }, [assignedRepIds, allSalesReps, allFollowUps, today, nextWeek]);

  const totalOverdue = repSections.reduce((s, r) => s + r.overdue.length, 0);
  const totalUpcoming = repSections.reduce((s, r) => s + r.upcoming.length, 0);

  const getAccountName = (id: string) => accounts.find(a => a.id === id)?.name || 'Unknown';
  const getAccountPriority = (id: string) => accounts.find(a => a.id === id)?.priorityTier || 'Low';

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Sales Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            {assignedRepIds.length} rep{assignedRepIds.length !== 1 ? 's' : ''} assigned · {totalOverdue} overdue · {totalUpcoming} due this week
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setShowInteraction(true)}>
            <Phone className="mr-1.5 h-3.5 w-3.5" /> Log Interaction
          </Button>
          <Button size="sm" variant="ghost" onClick={signOut}>
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Users className="h-3.5 w-3.5" /> Assigned Reps
            </div>
            <p className="text-2xl font-bold">{assignedRepIds.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" /> Overdue
            </div>
            <p className="text-2xl font-bold text-destructive">{totalOverdue}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <CalendarClock className="h-3.5 w-3.5" /> Due This Week
            </div>
            <p className="text-2xl font-bold">{totalUpcoming}</p>
          </CardContent>
        </Card>
      </div>

      {/* Manage reps (collapsible) */}
      <Card>
        <CardHeader className="pb-2 cursor-pointer select-none" onClick={() => setManageOpen(o => !o)}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-muted-foreground shrink-0" />
              Manage Assigned Reps
              <Badge variant="outline" className="text-xs">{assignedRepIds.length} / {allSalesReps.length}</Badge>
            </CardTitle>
            {manageOpen
              ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
              : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        </CardHeader>
        {manageOpen && (
          <CardContent className="pt-0">
            {allSalesReps.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No Sales reps in your store yet</p>
            ) : (
              <div className="space-y-2">
                {allSalesReps.map(rep => {
                  const isAssigned = assignedRepIds.includes(rep.id);
                  const busy = assigning === rep.id;
                  return (
                    <div
                      key={rep.id}
                      className="flex items-center justify-between py-2 px-3 rounded-lg border border-border/60"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-muted-foreground">
                            {rep.fullName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{rep.fullName}</p>
                          <p className="text-xs text-muted-foreground truncate">{rep.email}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={isAssigned ? 'outline' : 'default'}
                        className={cn("h-7 text-xs shrink-0 ml-2", isAssigned && "text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60")}
                        disabled={busy}
                        onClick={() => isAssigned ? handleUnassign(rep.id) : handleAssign(rep.id)}
                      >
                        {busy ? '...' : isAssigned
                          ? <><UserMinus className="h-3 w-3 mr-1" /> Unassign</>
                          : <><UserPlus className="h-3 w-3 mr-1" /> Assign</>}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Per-rep follow-up cards */}
      {assignedRepIds.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No reps assigned yet</p>
            <p className="text-xs text-muted-foreground mt-1">Open "Manage Assigned Reps" above to get started</p>
            <Button size="sm" variant="outline" className="mt-4" onClick={() => setManageOpen(true)}>
              <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Assign Reps
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {repSections.map(({ profile, overdue, upcoming }) => (
            <Card key={profile.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">{profile.fullName.charAt(0).toUpperCase()}</span>
                    </div>
                    {profile.fullName}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {overdue.length > 0 && (
                      <Badge variant="destructive" className="text-xs">{overdue.length} overdue</Badge>
                    )}
                    {upcoming.length > 0 && (
                      <Badge variant="secondary" className="text-xs">{upcoming.length} this week</Badge>
                    )}
                    {overdue.length === 0 && upcoming.length === 0 && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">All clear</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {overdue.length === 0 && upcoming.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">No pending follow-ups due this week</p>
                ) : (
                  <div className="space-y-1">
                    {overdue.map((f, i) => (
                      <div
                        key={`od-${i}`}
                        className="flex items-center justify-between py-2 px-2 rounded-lg bg-destructive/5 border border-destructive/10 cursor-pointer hover:bg-destructive/10 transition-colors"
                        onClick={() => navigate(`/accounts/${f.accountId}`)}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />
                            <p className="font-medium text-sm truncate">{getAccountName(f.accountId)}</p>
                          </div>
                          <p className="text-xs text-destructive ml-4.5">
                            Overdue · {new Date(f.dueDate).toLocaleDateString()} · {f.type}
                          </p>
                        </div>
                        <PriorityBadge tier={getAccountPriority(f.accountId)} />
                      </div>
                    ))}
                    {upcoming.map((f, i) => (
                      <div
                        key={`up-${i}`}
                        className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/accounts/${f.accountId}`)}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <CalendarClock className="h-3 w-3 text-muted-foreground shrink-0" />
                            <p className="font-medium text-sm truncate">{getAccountName(f.accountId)}</p>
                          </div>
                          <p className="text-xs text-muted-foreground ml-4.5">
                            Due {new Date(f.dueDate).toLocaleDateString()} · {f.type}
                          </p>
                        </div>
                        <PriorityBadge tier={getAccountPriority(f.accountId)} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <InteractionDialog
        key="sales-admin-global"
        open={showInteraction}
        onOpenChange={setShowInteraction}
        accounts={accounts}
        contacts={contacts}
        onSaved={handleSaved}
      />
    </div>
  );
}

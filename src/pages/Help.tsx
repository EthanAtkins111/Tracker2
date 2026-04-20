import { LayoutDashboard, Building2, Users, CalendarClock, TrendingUp, MapPin, FileDown, Bell, UserCog, BarChart2, Settings, LogIn, Search, CheckCircle2, Clock, Star, Repeat2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

interface FeatureSection {
  icon: React.ElementType;
  title: string;
  description: string;
  tips: string[];
  adminOnly?: boolean;
}

const sections: FeatureSection[] = [
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    description: "Your home base. Get a live snapshot of your territory at a glance.",
    tips: [
      "Suggested Visits shows high-priority accounts you haven't seen in 14+ days and any account you haven't visited in 30+ days.",
      "Follow-ups Due Today are highlighted — clear these first before heading out.",
      "Recent Visits shows the last 10 logged interactions so you can pick up where you left off.",
      "Use the Quick Actions (Log Interaction, Add Account, Add Contact) to capture data fast without navigating away.",
    ],
  },
  {
    icon: Building2,
    title: "Accounts",
    description: "The full list of every facility in your territory. Filter, sort, search, and plan your route.",
    tips: [
      "Use the tabs at the top to filter by account type (LTC, Retirement, Hospital, Clinic, Group Home).",
      "Filter by City, Priority, or Relationship Strength to zero in on a specific segment.",
      "Sort by 'Follow-up Urgency' to automatically surface the accounts that need attention most.",
      "Proximity Search: enter a postal code or address (or click 'Use My Location') to re-sort all accounts by distance from that point — great for planning a route.",
      "The badge on each card shows days since your last visit. Red means overdue.",
      "Export to CSV from the top-right to pull your full account list into a spreadsheet.",
    ],
  },
  {
    icon: Building2,
    title: "Account Detail",
    description: "Everything about one account in one place — details, contacts, history, and follow-ups.",
    tips: [
      "Edit any account field (priority, pipeline stage, relationship strength, account manager) by clicking the Edit button.",
      "Add contacts directly from this page — they'll be linked to the account automatically.",
      "The Interaction History timeline shows every visit, call, and email logged for this account.",
      "Pending follow-ups appear here — snooze them to a new date or mark them done.",
      "Tags help you categorize accounts for quick searching later.",
    ],
  },
  {
    icon: Users,
    title: "Contacts",
    description: "A directory of all contacts across every account in your territory.",
    tips: [
      "Search by name, role, or account name to find someone quickly.",
      "Click the phone or email icon to call or email directly from the browser.",
      "Edit or remove a contact at any time — changes are reflected on the account detail page too.",
    ],
  },
  {
    icon: CalendarClock,
    title: "Follow-ups",
    description: "Your task list. Every scheduled follow-up lives here so nothing falls through the cracks.",
    tips: [
      "Overdue follow-ups appear at the top in red — address these first.",
      "Snooze a follow-up if you can't get to it yet — pick a new date from the calendar.",
      "Mark Done to complete a follow-up without opening the account detail.",
      "Switch to the Completed tab to see your follow-up history.",
      "Follow-ups are created automatically when you log an interaction and choose a follow-up schedule (1 week, 1 month, 3 months, etc.).",
    ],
  },
  {
    icon: TrendingUp,
    title: "Sales Intelligence (Opportunities)",
    description: "Smart lists that surface the highest-value opportunities in your territory automatically.",
    tips: [
      "Top Opportunities: accounts with a weak or new relationship that haven't been visited in 14+ days — your best conversion targets.",
      "High Priority + Weak Relationship: accounts marked High priority but relationship is still Weak or New — these need focus.",
      "Large Accounts Stale: facilities with 100+ beds that haven't had a visit in 30+ days — high-volume accounts you don't want to lose.",
      "No manual setup needed — these lists update automatically based on your logged interactions.",
    ],
  },
  {
    icon: LogIn,
    title: "Logging Interactions",
    description: "Every visit, call, email, or demo you log builds the history that powers Suggested Visits and Opportunities.",
    tips: [
      "Log from anywhere — the Dashboard quick action, an account card, or the Account Detail page.",
      "Choose the interaction type: Visit, Call, Email, Demo, or Service Follow-up.",
      "Record an outcome — use the preset options or type your own (e.g. 'Will place order', 'Needs follow-up').",
      "Set a follow-up schedule right from the log dialog: 1 week, 1 month, 3 months, 6 months, or a custom date.",
      "The contact you select is saved with the interaction so your history stays detailed.",
    ],
  },
  {
    icon: Search,
    title: "Global Search",
    description: "Find any account or contact instantly from the header bar.",
    tips: [
      "Click the search icon in the top bar and start typing — results appear as you type.",
      "Works across account names, cities, and contact names.",
    ],
  },
  {
    icon: Settings,
    title: "Settings",
    description: "Customize contact roles for your store.",
    tips: [
      "Add custom roles (e.g. 'Director of Care', 'Purchasing Manager') that your team uses when adding contacts.",
      "Roles are per-store, so your team shares the same list.",
      "Remove or rename roles at any time.",
    ],
  },
  {
    icon: UserCog,
    title: "User Management",
    description: "Approve new team members and manage admin access.",
    tips: [
      "New sign-ups appear under Pending Approvals — approve or deny them before they can access the CRM.",
      "Toggle admin access for any user to give them access to User Management and Activity Report.",
      "Revoke access at any time to remove a user from the store.",
    ],
    adminOnly: true,
  },
  {
    icon: BarChart2,
    title: "Activity Report",
    description: "A breakdown of every rep's logged activity across the territory.",
    tips: [
      "See total interactions for each rep and how they break down by type (Visits, Calls, Emails, Demos).",
      "Sort reps by interaction count to spot who is most active.",
      "Last activity date helps you identify reps who may need check-ins.",
    ],
    adminOnly: true,
  },
];

const quickTips = [
  { icon: Star, text: "Log every interaction — even a quick call. It keeps Suggested Visits and Opportunities accurate." },
  { icon: Repeat2, text: "Always set a follow-up when logging an interaction. Use 1 month as a default cadence for active accounts." },
  { icon: MapPin, text: "Use Proximity Search when planning your day route. Enter your starting location and sort by distance." },
  { icon: CheckCircle2, text: "Clear your Follow-ups Due Today before anything else. It's the most time-sensitive list in the app." },
  { icon: Clock, text: "Check Suggested Visits weekly to ensure no account goes cold without a reason." },
  { icon: FileDown, text: "Export your account list to CSV before a territory review or manager check-in." },
];

export default function Help() {
  const { isAdmin } = useAuth();

  const visibleSections = isAdmin ? sections : sections.filter(s => !s.adminOnly);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">How to Use Motion Health CRM</h1>
        <p className="text-muted-foreground mt-1">
          A quick reference guide to every feature so you can get the most out of your territory.
        </p>
      </div>

      {/* Quick Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Tips for Full Capacity</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {quickTips.map((tip, i) => (
            <div key={i} className="flex items-start gap-3">
              <tip.icon className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <p className="text-sm text-muted-foreground">{tip.text}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Feature Sections */}
      <div className="space-y-4">
        {visibleSections.map((section) => (
          <Card key={section.title}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                  <section.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{section.title}</CardTitle>
                  {section.adminOnly && (
                    <Badge variant="secondary" className="text-xs">Admin</Badge>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground pt-1">{section.description}</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {section.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

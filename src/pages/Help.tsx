import {
  LayoutDashboard, Building2, Users, CalendarClock, TrendingUp,
  MapPin, Bell, UserCog, LogIn, Search, CheckCircle2, Clock,
  Star, Repeat2, CircleUser, ShieldCheck, UserPlus,
} from "lucide-react";
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
    description: "Your home base — personalised to your role so you see only what's relevant to you.",
    tips: [
      "Sales reps see their own follow-ups, a pinned Top 5 accounts list, and their top 3 opportunities. Pin and unpin accounts using the star icon.",
      "Sales Admins see a collapsible panel to assign/unassign Sales reps, then per-rep cards showing each rep's overdue and upcoming follow-ups.",
      "Managers see a store-wide rep leaderboard (weekly/monthly interaction counts), overdue follow-ups across all reps, and the top 10 accounts ranked by priority and staleness.",
      "Service and Retail roles see their team's shared follow-ups and recent activity across everyone in the same role group.",
      "If your dashboard shows 'Set your role first', go to My Account and save your role.",
    ],
  },
  {
    icon: Building2,
    title: "Accounts",
    description: "The full list of every facility in your territory. Filter, sort, search, and plan your route.",
    tips: [
      "Summary cards at the top show total accounts, contacts, high-priority accounts, and overdue follow-ups at a glance.",
      "Use the tabs at the top to filter by account type (LTC, Retirement, Hospital, Clinic, Group Home, Organization).",
      "Filter by City, Priority, or Relationship Strength to zero in on a specific segment.",
      "Sort by 'Follow-up Urgency' to automatically surface accounts that need attention most.",
      "Proximity Search: enter a postal code or address (or click 'Use My Location') to re-sort all accounts by distance — great for planning a day route.",
      "The badge on each card shows days since last visit. Red means overdue.",
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
      "Tags help you categorise accounts for quick searching later.",
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
    description: "Every visit, call, email, or demo you log builds the history that powers your dashboard, Suggested Visits, and Opportunities.",
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
    icon: CircleUser,
    title: "My Account",
    description: "Update your name, role, and sign out.",
    tips: [
      "Set your first and last name here — your name appears on every interaction you log so teammates know who recorded it.",
      "Change your role at any time. Your dashboard updates automatically to match your new role.",
      "Use the Sign Out button at the bottom of the page to log out securely.",
    ],
  },
  {
    icon: UserCog,
    title: "User Management",
    description: "Approve new team members, manage admin access, and remove users.",
    tips: [
      "New sign-ups appear under Pending Approvals — approve or remove them before they can access the CRM.",
      "Approving a user gives them full access based on the role they selected at sign-up.",
      "Toggle admin access for any approved user to grant or revoke access to User Management.",
      "Remove any user (pending or approved) to fully delete their account. They can sign up again with the same email if needed.",
      "You cannot remove your own account from this page.",
    ],
    adminOnly: true,
  },
];

const quickTips = [
  { icon: Star, text: "Log every interaction — even a quick call. It keeps your dashboard, Suggested Visits, and Opportunities accurate." },
  { icon: Repeat2, text: "Always set a follow-up when logging an interaction. Use 1 month as a default cadence for active accounts." },
  { icon: MapPin, text: "Use Proximity Search when planning your day. Enter your starting location and accounts re-sort by distance." },
  { icon: CheckCircle2, text: "Clear your overdue follow-ups before anything else — they're the most time-sensitive items in the app." },
  { icon: Clock, text: "Sales Admins: check the dashboard weekly to catch any rep whose follow-ups are slipping overdue." },
  { icon: ShieldCheck, text: "Admins: approve new users promptly so your team isn't blocked at the Pending Approval screen." },
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
          <CardTitle className="text-base">Quick Tips</CardTitle>
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

import { PageLayout } from '@/components/marketing/PageLayout';

const config = {
  "hero": {
    "badge": "For CFOs",
    "title": "Board-Level",
    "titleHighlight": "Visibility",
    "description": "Stop worrying about surprise tax liabilities. Get a real-time dashboard of your Qualifying Free Zone Person status."
  },
  "features": {
    "heading": "Command the Ledger",
    "items": [
      {
        "icon": "BarChart3",
        "title": "Executive Dashboards",
        "description": "Clear visualizations of revenue ratios and risk thresholds."
      },
      {
        "icon": "FileCheck",
        "title": "Automated Provisioning",
        "description": "Export exact tax provisions for your month-end close."
      },
      {
        "icon": "ShieldCheck",
        "title": "Audit Defense",
        "description": "Sleep peacefully knowing your 0% rate is cryptographically proven."
      }
    ]
  },
  "benefits": [
    {
      "badge": "Strategic",
      "badgeIcon": "TrendingUp",
      "title": "Transition from Bookkeeper to Strategist",
      "description": "Automate the tedious compliance work so you can focus on capital allocation.",
      "bullets": [
        "Automate month-end tax classification",
        "Provide real-time updates to the Board",
        "Reduce external consultant dependencies"
      ]
    }
  ]
};

export default function Page() {
  return <PageLayout config={config} />;
}

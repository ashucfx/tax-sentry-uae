import { PageLayout } from '@/components/marketing/PageLayout';

const config = {
  "hero": {
    "badge": "For Startups",
    "title": "SME Tax",
    "titleHighlight": "Compliance",
    "description": "You incorporated in a Free Zone to grow fast, not to become a tax expert. We automate the 9% CT headache."
  },
  "features": {
    "heading": "Set It and Forget It",
    "items": [
      {
        "icon": "Zap",
        "title": "5-Minute Setup",
        "description": "Connect Xero, map your accounts, and you are done."
      },
      {
        "icon": "CheckCircle2",
        "title": "Small Business Relief",
        "description": "Automated tracking for the AED 3M revenue relief threshold."
      },
      {
        "icon": "Clock",
        "title": "Time Savings",
        "description": "Save 20+ hours a month on manual compliance checks."
      }
    ]
  }
};

export default function Page() {
  return <PageLayout config={config} />;
}

import { PageLayout } from '@/components/marketing/PageLayout';

const config = {
  "hero": {
    "badge": "Resources",
    "title": "UAE Tax",
    "titleHighlight": "Glossary",
    "description": "A plain-English dictionary of UAE Corporate Tax terminology. Stop decoding FTA legal jargon."
  },
  "features": {
    "heading": "Key Concepts",
    "items": [
      {
        "icon": "Building2",
        "title": "Qualifying Free Zone Person (QFZP)",
        "description": "The legal status required to benefit from the 0% rate."
      },
      {
        "icon": "TrendingUp",
        "title": "Qualifying Income",
        "description": "Revenue streams eligible for the 0% corporate tax rate."
      },
      {
        "icon": "ArrowRight",
        "title": "De-Minimis Rule",
        "description": "The AED 3M or 5% safety net for non-qualifying revenue."
      }
    ]
  }
};

export default function Page() {
  return <PageLayout config={config} />;
}

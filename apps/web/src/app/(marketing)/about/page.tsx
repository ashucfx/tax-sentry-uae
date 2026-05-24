import { PageLayout } from '@/components/marketing/PageLayout';

const config = {
  "hero": {
    "badge": "Company",
    "title": "About",
    "titleHighlight": "TaxSentry",
    "description": "We are building the compliance infrastructure layer for the UAEs modern economy. Backed by Ripple Nexus."
  },
  "features": {
    "heading": "Our Mission",
    "items": [
      {
        "icon": "ShieldCheck",
        "title": "Protect Businesses",
        "description": "We believe compliance should be an asset, not a liability."
      },
      {
        "icon": "Globe",
        "title": "UAE First",
        "description": "Built exclusively for the nuances of the UAE tax regime."
      },
      {
        "icon": "Zap",
        "title": "Engineering Excellence",
        "description": "We replace consultants with code."
      }
    ]
  }
};

export default function Page() {
  return <PageLayout config={config} />;
}

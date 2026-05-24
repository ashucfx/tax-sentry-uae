import { PageLayout } from '@/components/marketing/PageLayout';

const config = {
  "hero": {
    "badge": "Company",
    "title": "Contact",
    "titleHighlight": "Sales",
    "description": "Ready to secure your 0% corporate tax rate? Talk to our enterprise solutions team."
  },
  "features": {
    "heading": "Get in Touch",
    "items": [
      {
        "icon": "Mail",
        "title": "Email",
        "description": "hello@taxsentry.com"
      },
      {
        "icon": "Globe",
        "title": "Headquarters",
        "description": "Dubai International Financial Centre (DIFC)"
      },
      {
        "icon": "Users",
        "title": "Support",
        "description": "24/7 dedicated enterprise support lines."
      }
    ]
  }
};

export default function Page() {
  return <PageLayout config={config} />;
}

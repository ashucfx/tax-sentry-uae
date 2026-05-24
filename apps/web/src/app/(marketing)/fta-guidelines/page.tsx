import { PageLayout } from '@/components/marketing/PageLayout';

const config = {
  "hero": {
    "badge": "Resources",
    "title": "FTA",
    "titleHighlight": "Guidelines",
    "description": "A centralized, heavily annotated repository of all relevant Federal Tax Authority decisions and Cabinet mandates."
  },
  "features": {
    "heading": "The Law, Simplified",
    "items": [
      {
        "icon": "FileCheck",
        "title": "Cabinet Decision No. 139",
        "description": "Regarding Qualifying Income and activities."
      },
      {
        "icon": "ShieldCheck",
        "title": "Ministerial Decision No. 265",
        "description": "Regarding Qualifying Activities and Excluded Activities."
      },
      {
        "icon": "Clock",
        "title": "Timelines",
        "description": "Important filing deadlines and registration dates."
      }
    ]
  }
};

export default function Page() {
  return <PageLayout config={config} />;
}

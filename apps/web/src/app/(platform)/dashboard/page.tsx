import { RiskHeroCard } from '@/components/dashboard/RiskHeroCard';
import { MetricsCards } from '@/components/dashboard/MetricsCards';
import { DeMinimisRow } from '@/components/dashboard/DeMinimisRow';
import { RevenueMixRow } from '@/components/dashboard/RevenueMixRow';
import { ActionFeedRow } from '@/components/dashboard/ActionFeedRow';
import { SubstanceHealthRow } from '@/components/dashboard/SubstanceHealthRow';
import { TopRibbon } from '@/components/dashboard/TopRibbon';
import { Lock, ShieldCheck, BookOpen, Users } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col" style={{ background: 'var(--ts-bg-base)' }}>
      <TopRibbon />

      <div className="flex-1 w-full max-w-[1200px] mx-auto px-6 py-6 space-y-6">
        {/* 1. KPI strip */}
        <MetricsCards />

        {/* 2. De-Minimis threshold monitor — primary QFZP risk */}
        <DeMinimisRow />

        {/* 3. Risk score + Action feed */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <RiskHeroCard />
          </div>
          <div className="lg:col-span-2">
            <ActionFeedRow />
          </div>
        </div>

        {/* 4. Revenue mix chart */}
        <RevenueMixRow />

        {/* 5. Substance health */}
        <SubstanceHealthRow />
      </div>

      {/* Trust footer */}
      <footer
        className="mt-auto"
        style={{
          borderTop: '1px solid var(--ts-border)',
          background: 'var(--ts-bg-deepest)',
        }}
      >
        <div
          className="max-w-[1200px] mx-auto px-6 py-3 flex items-center justify-between"
          style={{ fontSize: 12, color: 'var(--ts-fg-dimmer)' }}
        >
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5">
              <Lock size={12} />
              AES-256 encrypted
            </span>
            <span className="hidden sm:flex items-center gap-1.5">
              <ShieldCheck size={12} />
              Audit log enabled
            </span>
            <span className="hidden md:flex items-center gap-1.5">
              <BookOpen size={12} />
              Cabinet Decision 100/2023
            </span>
            <span className="hidden lg:flex items-center gap-1.5">
              <Users size={12} />
              Role-based access
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/audit-log" style={{ color: 'inherit' }} className="hover:text-white transition-colors">Audit Log</a>
            <span style={{ color: 'var(--ts-border)' }}>·</span>
            <a href="/status" style={{ color: 'inherit' }} className="hover:text-white transition-colors">System Status</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

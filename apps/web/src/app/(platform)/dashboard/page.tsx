import { Suspense } from 'react';
import { RiskHeroCard } from '@/components/dashboard/RiskHeroCard';
import { DeMinimisRow } from '@/components/dashboard/DeMinimisRow';
import { RevenueMixRow } from '@/components/dashboard/RevenueMixRow';
import { ActionFeedRow } from '@/components/dashboard/ActionFeedRow';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { SubstanceHealthRow } from '@/components/dashboard/SubstanceHealthRow';
import { TopRibbon } from '@/components/dashboard/TopRibbon';
import { Lock, ShieldCheck, BookOpen, Users } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Status ribbon — always visible, sticky */}
      <TopRibbon />

      <div className="flex-1 px-6 py-6 max-w-[1200px] w-full mx-auto space-y-7">
        <Suspense fallback={<DashboardSkeleton />}>
          {/* 1. Core Risk Score Hero — The 'CFO View' */}
          <RiskHeroCard />

          {/* 2. De-minimis — the most critical secondary metric */}
          <DeMinimisRow />

          <SubstanceHealthRow />

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-7">
            {/* 3. Revenue breakdown */}
            <div className="lg:col-span-3">
              <RevenueMixRow />
            </div>

            {/* 4. Action Feed — Real-time alerts */}
            <div className="lg:col-span-2">
              <ActionFeedRow />
            </div>
          </div>
        </Suspense>
      </div>

      {/* Trust footer */}
      <footer className="border-t border-border bg-card mt-auto">
        <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-muted-foreground/60" />
              AES-256 encrypted
            </span>
            <span className="hidden sm:flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-muted-foreground/60" />
              Audit log enabled
            </span>
            <span className="hidden md:flex items-center gap-1.5">
              <BookOpen className="w-3 h-3 text-muted-foreground/60" />
              Cabinet Decision 100/2023
            </span>
            <span className="hidden lg:flex items-center gap-1.5">
              <Users className="w-3 h-3 text-muted-foreground/60" />
              Role-based access
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <a href="/audit-log" className="hover:text-foreground">Audit Log</a>
            <span className="text-border">·</span>
            <a href="/status" className="hover:text-foreground">System Status</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

import { Sidebar } from '@/components/layout/Sidebar';
import { AuthProvider } from '@/components/layout/AuthProvider';
import { DunningBanner } from '@/components/layout/DunningBanner';

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row relative">
      <Sidebar />
      <div className="flex-1 min-w-0 md:ml-[240px] mt-16 md:mt-0 flex flex-col">
        <AuthProvider>
          <DunningBanner />
          {children}
        </AuthProvider>
      </div>
    </div>
  );
}

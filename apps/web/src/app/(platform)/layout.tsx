import { ClerkProvider } from '@clerk/nextjs';
import { Sidebar } from '@/components/layout/Sidebar';

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 ml-60 min-w-0">
          {children}
        </div>
      </div>
    </ClerkProvider>
  );
}

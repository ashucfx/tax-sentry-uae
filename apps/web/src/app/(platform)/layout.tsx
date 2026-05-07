import { Sidebar } from '@/components/layout/Sidebar';
import { AuthProvider } from '@/components/layout/AuthProvider';

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 min-w-0" style={{ marginLeft: 240 }}>
        <AuthProvider>{children}</AuthProvider>
      </div>
    </div>
  );
}

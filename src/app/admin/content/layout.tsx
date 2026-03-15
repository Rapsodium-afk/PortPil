import { AppShell } from '@/components/shared/app-shell';

export default function AdminContentLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

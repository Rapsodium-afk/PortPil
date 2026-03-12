import { AppShell } from '@/components/shared/app-shell';

export default function CauLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

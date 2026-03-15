'use client';

import React, { useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Anchor, Bell, ChevronDown, LayoutDashboard, LogOut, MessageSquare, PanelLeft, Settings,
  Ship, Users, FlaskConical, FolderKanban, Truck, Building2, User as UserIcon,
  ShieldCheck, HardHat, Landmark, Megaphone, UserCheck, ClipboardList, ClipboardCheck,
  UserPlus, QrCode, KeySquare, Tags, FileText, BarChart3
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { AdminImpersonationTool } from './admin-impersonation-tool';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserRole } from '@/lib/types';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, roles, isLoading, logout, userCompanies, activeCompany, setActiveCompany, config } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  const navItems = useMemo(() => {
    const allItems = [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Soporte', 'Soporte', 'Media Manager', 'Operador Logístico', 'Transitario', 'Agente de Aduanas', 'Gestor Situación', 'Operador Situación'] as UserRole[] },
      { href: '/cau', label: 'CAU', icon: MessageSquare, roles: ['Admin', 'Soporte', 'Soporte', 'Operador Logístico', 'Transitario', 'Agente de Aduanas'] as UserRole[] },
      { href: '/access-requests', label: 'Acceso Conductores', icon: UserPlus, roles: ['Admin', 'Soporte', 'Soporte', 'Operador Logístico', 'Transitario', 'Agente de Aduanas', 'Agente de Aduanas'] as UserRole[] },
      { href: '/expediente', label: 'Mi Expediente', icon: FolderKanban, roles: ['Admin', 'Soporte', 'Soporte', 'Media Manager', 'Operador Logístico', 'Transitario', 'Agente de Aduanas'] as UserRole[]},
      { href: '/flota', label: 'Gestor de Flotas', icon: Truck, roles: ['Operador Logístico', 'Admin'] as UserRole[] },
      { href: '/situacion', label: 'Actualizar Plazas', icon: ClipboardList, roles: ['Admin', 'Gestor Situación', 'Operador Situación'] as UserRole[] },
      { href: '/admin/companies', label: 'Gestión Empresas', icon: Building2, roles: ['Admin', 'Soporte'] as UserRole[] },
      { href: '/admin/users', label: 'Gestión Usuarios', icon: Users, roles: ['Admin', 'Soporte'] as UserRole[] },
      { href: '/admin/roles', label: 'Gestión Roles', icon: KeySquare, roles: ['Admin'] as UserRole[] },
      { href: '/admin/content', label: 'Gestor de Contenido', icon: Megaphone, roles: ['Admin', 'Media Manager'] as UserRole[] },
      { href: '/comunicados', label: 'Comunicados', icon: FileText, roles: ['Admin', 'Soporte', 'Media Manager', 'Operador Logístico', 'Transitario', 'Agente de Aduanas'] as UserRole[] },
      { href: '/admin/cau-config', label: 'Configuración CAU', icon: Tags, roles: ['Admin', 'Soporte'] as UserRole[] },
      { href: '/admin/performance', label: 'Rendimiento de Agentes', icon: BarChart3, roles: ['Admin'] as UserRole[] },
      { href: '/admin/settings', label: 'Ajustes', icon: Settings, roles: ['Admin'] as UserRole[] },
      { href: '/admin/api-test', label: 'Prueba de API', icon: FlaskConical, roles: ['Admin'] as UserRole[] },
    ];

    if (!user || !Array.isArray(roles)) return [];

    return allItems.filter(item => item.roles.some(role => roles.includes(role)));

  }, [user, roles]);

  const RoleIcon = useMemo(() => {
    if (!user || !Array.isArray(roles) || roles.length === 0) {
      return <UserIcon className="h-5 w-5" />;
    }
    const role = roles[0];
    switch (role) {
      case 'Admin':
        return <ShieldCheck className="h-5 w-5" />;
      case 'Soporte':
        return <HardHat className="h-5 w-5" />;
      case 'Soporte':
        return <Landmark className="h-5 w-5" />;
      case 'Media Manager':
        return <Megaphone className="h-5 w-5" />;
      case 'Operador Logístico':
        return <Truck className="h-5 w-5" />;
      case 'Transitario':
        return <Ship className="h-5 w-5" />;
      case 'Agente de Aduanas':
        return <UserCheck className="h-5 w-5" />;
      case 'Gestor Situación':
        return <ClipboardCheck className="h-5 w-5" />;
      case 'Operador Situación':
          return <ClipboardList className="h-5 w-5" />;
      default:
        return <UserIcon className="h-5 w-5" />;
    }
  }, [user, roles]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
          <div className="flex items-center gap-2 font-semibold">
            <Anchor className="h-6 w-6 text-primary" />
            <span>{config?.portalName || 'PortPilot CAU'}</span>
          </div>
      </div>
    );
  }
  
  const handleCompanyChange = (companyId: string) => {
    const newActiveCompany = userCompanies.find(c => c.id === companyId);
    if (newActiveCompany) {
      setActiveCompany(newActiveCompany);
    }
  };

  return (
    <TooltipProvider>
    <div className="flex min-h-screen w-full bg-muted/40">
      <aside className={`relative z-10 hidden flex-col border-r bg-background transition-all duration-300 md:flex ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" onClick={() => router.push('/')}>
            <Ship className="h-4 w-4" />
          </Button>
          <span className={`font-semibold ${!isSidebarOpen && 'hidden'}`}>{config?.portalName || 'PortPilot CAU'}</span>
        </div>
        <nav className="flex-1 space-y-2 p-4">
          {navItems.map((item) => (
             isSidebarOpen ? (
            <Button
              key={item.href}
              variant={pathname.startsWith(item.href) ? 'secondary' : 'ghost'}
              className="w-full justify-start"
              onClick={() => router.push(item.href)}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
            ) : (
            <Tooltip key={item.href} delayDuration={0}>
                <TooltipTrigger asChild>
                    <Button
                        variant={pathname.startsWith(item.href) ? 'secondary' : 'ghost'}
                        size="icon"
                        className="w-full"
                        onClick={() => router.push(item.href)}
                    >
                        <item.icon className="h-5 w-5" />
                        <span className="sr-only">{item.label}</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                    <p>{item.label}</p>
                </TooltipContent>
            </Tooltip>
            )
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background px-6">
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="shrink-0">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle sidebar</span>
            </Button>
          <div className="flex items-center gap-4">
            <AdminImpersonationTool />
             {userCompanies.length > 1 && (
                <Select value={activeCompany?.id} onValueChange={handleCompanyChange}>
                    <SelectTrigger className="w-[180px] h-9">
                        <div className="flex items-center gap-2">
                           <Building2 className="h-4 w-4 text-muted-foreground" />
                           <SelectValue placeholder="Seleccionar empresa..." />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        {userCompanies.map(company => (
                            <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
             )}
             <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5"/>
                <span className="sr-only">Notificaciones</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt={user.name} />
                    <AvatarFallback>
                      {RoleIcon}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden flex-col items-start md:flex">
                    <span className="text-sm font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">{Array.isArray(roles) ? roles.join(', ') : ''}</span>
                  </div>
                  <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                    <UserIcon className="mr-2 h-4 w-4"/>
                    <span>Mis Ajustes</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
    </TooltipProvider>
  );
}

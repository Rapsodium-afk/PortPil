'use client';

import React, { useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Anchor, Bell, ChevronDown, ChevronRight, LayoutDashboard, LogOut, MessageSquare, PanelLeft, Settings,
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
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Soporte', 'Media Manager', 'Operador Logístico', 'Transitario', 'Agente de Aduanas', 'Gestor Situación', 'Operador Situación'] as UserRole[] },
      { href: '/traceability', label: 'Trazabilidad APBA', icon: BarChart3, roles: ['Admin', 'Soporte', 'Media Manager', 'Operador Logístico', 'Transitario', 'Agente de Aduanas', 'Gestor Situación', 'Operador Situación'] as UserRole[] },
      { href: '/cau', label: 'CAU', icon: MessageSquare, roles: ['Admin', 'Soporte', 'Operador Logístico', 'Transitario', 'Agente de Aduanas'] as UserRole[] },
      { href: '/access-requests', label: 'Acceso Conductores', icon: UserPlus, roles: ['Admin', 'Soporte', 'Operador Logístico', 'Transitario', 'Agente de Aduanas'] as UserRole[] },
      { href: '/expediente', label: 'Mi Expediente', icon: FolderKanban, roles: ['Admin', 'Soporte', 'Media Manager', 'Operador Logístico', 'Transitario', 'Agente de Aduanas'] as UserRole[]},
      { href: '/flota', label: 'Gestor de Flotas', icon: Truck, roles: ['Operador Logístico', 'Admin'] as UserRole[] },
      { href: '/situacion', label: 'Actualizar Plazas', icon: ClipboardList, roles: ['Admin', 'Gestor Situación', 'Operador Situación'] as UserRole[] },
      { href: '/comunicados', label: 'Comunicados', icon: FileText, roles: ['Admin', 'Soporte', 'Media Manager', 'Operador Logístico', 'Transitario', 'Agente de Aduanas'] as UserRole[] },
      { 
        label: 'Administración', 
        icon: Settings, 
        roles: ['Admin', 'Soporte'] as UserRole[],
        subItems: [
          { href: '/admin/companies', label: 'Gestión Empresas', roles: ['Admin', 'Soporte'] as UserRole[] },
          { href: '/admin/users', label: 'Gestión Usuarios', roles: ['Admin', 'Soporte'] as UserRole[] },
          { href: '/admin/roles', label: 'Gestión Roles', roles: ['Admin'] as UserRole[] },
          { href: '/admin/cau-config', label: 'Configuración CAU', roles: ['Admin', 'Soporte'] as UserRole[] },
          { href: '/admin/content', label: 'Gestor de Contenido', roles: ['Admin', 'Media Manager'] as UserRole[] },
          { href: '/admin/performance', label: 'Rendimiento', roles: ['Admin'] as UserRole[] },
          { href: '/admin/settings', label: 'Ajustes de Sistema', roles: ['Admin'] as UserRole[] },
          { href: '/admin/api-test', label: 'Prueba de API', roles: ['Admin'] as UserRole[] },
        ]
      },
    ];

    if (!user || !Array.isArray(roles)) return [];

    return allItems.filter(item => {
      const parentHasRole = item.roles.some(role => roles.includes(role));
      if (!parentHasRole) return false;
      
      if (item.subItems) {
        item.subItems = item.subItems.filter(sub => sub.roles.some(role => roles.includes(role)));
        return item.subItems.length > 0;
      }
      
      return true;
    });

  }, [user, roles]);

  const [isAdminMenuOpen, setIsAdminMenuOpen] = React.useState(pathname.startsWith('/admin'));

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
          {navItems.map((item) => {
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isActive = item.href ? pathname.startsWith(item.href) : (hasSubItems ? pathname.startsWith('/admin') : false);

            if (!isSidebarOpen) {
              return (
                <Tooltip key={item.label} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      size="icon"
                      className="w-full"
                      onClick={() => item.href ? router.push(item.href) : (hasSubItems && setIsAdminMenuOpen(!isAdminMenuOpen))}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="sr-only">{item.label}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return (
              <div key={item.label} className="space-y-1">
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => {
                    if (item.href) {
                      router.push(item.href);
                    } else if (hasSubItems) {
                      setIsAdminMenuOpen(!isAdminMenuOpen);
                    }
                  }}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {hasSubItems && (
                    isAdminMenuOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                  )}
                </Button>

                {hasSubItems && isAdminMenuOpen && (
                  <div className="ml-6 space-y-1 border-l pl-2">
                    {item.subItems!.map((sub) => (
                      <Button
                        key={sub.href}
                        variant={pathname === sub.href ? 'secondary' : 'ghost'}
                        className="h-8 w-full justify-start text-sm font-normal"
                        onClick={() => router.push(sub.href)}
                      >
                        {sub.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
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

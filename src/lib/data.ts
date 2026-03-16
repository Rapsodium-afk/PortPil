// This file is no longer the primary source of truth.
// The data has been moved to individual JSON files in the src/data/ directory.
// The application now reads from those files.
// This file can be removed or kept for reference, but it's not actively used by the app.

import type { User, NewsPost, OccupancyZone, CauRequest, CauRequestType } from './types';

// Mock Users - Used for initial seeding if JSON is empty
export const mockUsers: User[] = [
  { id: '1', name: 'Director General', email: 'admin@portpilot.test', roles: ['Admin'], status: 'active', companyIds: [], password: 'admin' },
  { id: '2', name: 'Agente de Aduanas', email: 'aduana@portpilot.test', roles: ['Agente de Aduanas'], status: 'active', companyIds: [], password: 'aduana' },
  { id: '3', name: 'Transportista Juan', email: 'user@portpilot.test', roles: ['Usuario'], status: 'active', companyIds: [], password: 'user' },
  { id: '4', name: 'Lucía Gómez', email: 'lucia.gomez@transport.com', roles: ['Usuario'], status: 'active', companyIds: [], password: 'password123' },
  { id: '5', name: 'Carlos Fernández', email: 'carlos.f@logistics.co', roles: ['Usuario'], status: 'active', companyIds: [], password: 'password123' },
];

// Mock News Feed - Used for initial seeding if JSON is empty
export const mockNews: NewsPost[] = [
  {
    id: '1',
    title: 'Retrasos en TTP2',
    content: 'Retrasos en puerta TTP2 por mantenimiento no programado. Se espera resolución en 2 horas.',
    author: 'Director General',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    title: 'Nueva política de acceso',
    content: 'La nueva política de acceso para transportistas entrará en vigor el próximo lunes. Consulten la documentación.',
    author: 'Director General',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Mock Occupancy Data - Used for initial seeding if JSON is empty
export const mockOccupancy: OccupancyZone[] = [
  { id: 'ttp1', name: 'Zona TTP1 (Import)', percentage: 75 },
  { id: 'ttp2', name: 'Zona TTP2 (Export)', percentage: 40 },
  { id: 'aux', name: 'Zonas Auxiliares', percentage: 60 },
];

// Mock CAU Request Types - Used for initial seeding if JSON is empty
export const mockCauRequestTypes: CauRequestType[] = [
    { id: 'op-reparacion', category: 'Operativas', title: 'Solicitud de reparación de camión en la terminal', requiresFile: false, requiresUti: true, description: 'Informar sobre una avería y solicitar asistencia.' },
    { 
      id: 'op-flota', 
      category: 'Operativas', 
      title: 'Solicitud de modificación de flota', 
      requiresFile: true, 
      requiresUti: false, 
      description: 'Añadir o eliminar vehículos de su flota autorizada.',
      customFields: [
        { id: 'excel-flota', name: 'Archivo de Flota (Excel)', type: 'file', required: true }
      ]
    },
    { id: 'op-alta-no-uti', category: 'Operativas', title: 'Solicitud de Alta de vehículo no UTI en la terminal', requiresFile: false, requiresUti: false, description: 'Solicitud anual para vehículos especiales.' },
    { id: 'op-copia-recibo', category: 'Operativas', title: 'Solicitud de copia de recibo', requiresFile: false, requiresUti: false, description: 'Pedir duplicados de recibos o justificantes de pago.' },
    { id: 'op-reclamacion', category: 'Operativas', title: 'Reclamación de facturas', requiresFile: false, requiresUti: false, description: 'Discrepancias o errores en la facturación.' },
    { id: 'op-alta-logistica', category: 'Operativas', title: 'Solicitud de alta como flota logística', requiresFile: false, requiresUti: false, description: 'Registrar una nueva empresa de transporte.' },
    { id: 'ad-salida', category: 'Aduaneras', title: 'Solicitud de autorización de salida (Notificación de C5)', requiresFile: false, requiresUti: true, description: 'Notificar la salida de mercancía bajo control aduanero.' },
    { id: 'ad-info', category: 'Aduaneras', title: 'Solicitud de información de camión (salida permitida)', requiresFile: false, requiresUti: true, description: 'Consultar si un vehículo está autorizado a salir.' },
    { id: 'ad-matricula', category: 'Aduaneras', title: 'Notificación de matrícula de contenedor (UTIS con contenedor declarado)', requiresFile: false, requiresUti: true, description: 'Declarar la matrícula del contenedor asociado a una UTI.' },
    { id: 'ad-representante', category: 'Aduaneras', title: 'Notificación como representante de UTI (Para circuitos rojos aduaneros)', requiresFile: false, requiresUti: true, description: 'Designarse como representante para inspecciones.' },
    { id: 'ad-desbloqueo', category: 'Aduaneras', title: 'Solicitud de desbloqueo por otros motivos', requiresFile: false, requiresUti: false, description: 'Solicitudes de desbloqueo no contempladas en otros apartados.' },
    { id: 'ad-destruccion', category: 'Aduaneras', title: 'Notificación de mercancía para destrucción', requiresFile: false, requiresUti: false, description: 'Informar sobre mercancía que será destruida.' },
];

// Mock CAU Requests - Used for initial seeding if JSON is empty
export const mockCauRequests: CauRequest[] = [
  {
    id: 'cau-1',
    subject: 'Problema con DUA #12345',
    userId: '3',
    userName: 'Transportista Juan',
    companyId: 'comp-1',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    status: 'Pendiente documentación',
    category: 'Aduaneras',
    type: 'Solicitud de desbloqueo por otros motivos',
    attachments: [{ name: 'DUA_12345.pdf', url: '#' }],
    history: [
      { id: 'msg-1', author: 'Transportista Juan', authorRole: 'Usuario', content: 'El documento de autoliquidación adjunto parece tener un error en el campo de valor declarado. ¿Pueden revisarlo?', createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
      { id: 'msg-2', author: 'Agente de Aduanas', authorRole: 'Agente de Aduanas', content: 'Recibido. Por favor, adjunte también la factura comercial para poder contrastar la información.', createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() }
    ],
  },
  {
    id: 'cau-2',
    subject: 'Consulta sobre documentación para carga peligrosa',
    userId: '4',
    userName: 'Lucía Gómez',
    companyId: 'comp-1',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Aprobado',
    category: 'Operativas',
    type: 'Solicitud de información de camión (salida permitida)',
    uti: 'AB-1234-CD',
    attachments: [],
    history: [
      { id: 'msg-3', author: 'Lucía Gómez', authorRole: 'Usuario', content: 'Necesito saber qué documentos adicionales se requieren para un contenedor con mercancía IMO clase 3.', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'msg-4', author: 'Director General', authorRole: 'Admin', content: 'Para IMO 3 necesita la "Declaración de Mercancías Peligrosas" y la "Ficha de Datos de Seguridad". Su solicitud de salida ha sido pre-aprobada.', createdAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString() }
    ],
  },
  {
    id: 'cau-3',
    subject: 'Urgente: Acceso denegado en TTP1',
    userId: '5',
    userName: 'Carlos Fernández',
    companyId: 'comp-1',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    status: 'En curso',
    category: 'Operativas',
    type: 'Solicitud de reparación de camión en la terminal',
    uti: 'EF-5678-GH',
    attachments: [{ name: 'autorizacion_conductor.pdf', url: '#' }, { name: 'foto_incidencia.jpg', url: '#' }],
    history: [
      { id: 'msg-5', author: 'Carlos Fernández', authorRole: 'Usuario', content: 'Mi conductor no puede acceder a la zona de importación. Su ID es 789123. Adjunto la autorización.', createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() }
    ]
  },
];

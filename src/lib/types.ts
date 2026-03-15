export type UserRole = 'Admin' | 'Soporte' | 'Soporte Operativo' | 'Soporte Aduanas' | 'Media Manager' | 'Operador Logístico' | 'Transitario' | 'Agente de Aduanas' | 'Gestor Situación' | 'Operador Situación' | 'Usuario' | 'Aduana';
export type UserStatus = 'active' | 'pending';

export interface Company {
  id: string;
  name: string;
  taxId: string;
  accessControlId?: string;
  expedienteFiles?: {
    name: string;
    url: string;
    uploadedBy: string; // Name of the admin/agent
    createdAt: string;
  }[];
}

export type RoleType = 'Staff' | 'Client';

export interface RoleDefinition {
  id: UserRole;
  name: string;
  type: RoleType;
  visibleZones: string[]; // IDs of zones this role can see
}

export interface OccupancyZone {
  id: string;
  name: string;
  percentage: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];
  status: UserStatus;
  password?: string; // Only for creation/mock
  companyIds: string[];

  // New fields for registration
  registrationAttachments?: { name: string; url: string }[];
  
  preferences?: NotificationPreferences;
}

export interface NotificationPreferences {
  notifyCauEmail: boolean;
  notifyCauReplyEmail: boolean;
  notifyQrAccessEmail: boolean;
  notifyFleetUpdatesEmail: boolean;
  notifyFleetMovementsEmail: boolean;
}

export interface NewsPost {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  imageUrl?: string;
}

export type ZoneCategory = 'TERMINAL' | 'ZONA_AUXILIAR';
export type ZoneStatus = 'Solo para import' | 'Import y Export' | 'Solo para export' | 'Solo salidas';
export type OperatingStatus = 'Abierta' | 'Cerrada' | 'No operativa';

export interface SituationZone {
  id: string;
  name: string;
  category: ZoneCategory;
  freeSpots: number;
  maxSpots: number;
  status: ZoneStatus;
  operatingStatus: OperatingStatus;
  lastUpdated: string;
  withStaff?: boolean;
}

export type CauRequestCategory = string;

export interface CauCategory {
  id: string;
  name: string;
}

export type CauRequestStatus = 
  | 'Aprobado' 
  | 'Pendiente documentación' 
  | 'No autorizado' 
  | 'Denegado' 
  | 'En curso' 
  | 'Pendiente'
  | 'Respondido'
  | 'Archivada'
  | 'Caducada'
  | 'Cerrada';

export interface CustomField {
    id: string;
    name: string;
    type: 'text' | 'file';
    required?: boolean;
    validationType?: 'text' | 'numeric' | 'alphanumeric';
    maxLength?: number;
}

export interface CauRequestType {
    id: string;
    category: CauRequestCategory;
    title: string;
    requiresFile: boolean;
    requiresUti: boolean;
    description: string;
    customFields?: CustomField[];
    estimatedResponseTime?: number; // In hours
    allowedRoles?: UserRole[];
}

export interface CauMessage {
  id: string;
  author: string;
  authorRole: UserRole | 'Sistema';
  content: string;
  createdAt: string;
}

export interface CauRequest {
  id: string;
  subject: string;
  userId: string;
  userName: string;
  companyId: string;
  createdAt: string;
  status: CauRequestStatus;
  category: CauRequestCategory;
  type: string;
  uti?: string;
  attachments: { name: string; url: string }[];
  history: CauMessage[];
  customFieldsData?: Record<string, any>;
  slaExpiresAt?: string;
}

export interface AgentStats {
  agentId: string;
  agentName: string;
  attendedRequests: number;
  totalResponseTime: number; // in milliseconds
  averageResponseTime: number; // in minutes
}

export interface DatabaseConfig {
  dbHost?: string;
  dbPort?: number;
  dbUser?: string;
  dbPassword?: string;
  dbName?: string;
}

export interface EmailConfig {
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  fromEmail?: string;
}

export type PersistenceMode = 'json' | 'db';

export interface ModulePersistence {
  users: PersistenceMode;
  news: PersistenceMode;
  cau: PersistenceMode;
  occupancy: PersistenceMode;
  fleet: PersistenceMode;
}

export interface SystemConfig {
  utiApiToken: string;
  emailConfig?: EmailConfig;
  dbConfig?: DatabaseConfig;
  modulePersistence?: ModulePersistence;
  situationInstructions?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImageId?: string;
  portalName?: string;
  portalDescription?: string;
  defaultNotificationPreferences?: NotificationPreferences;
  storagePaths?: {
    documents: string;
    images: string;
    backups: string;
  };
}

export type UtiDetails = {
    idTrailerTrack?: number;
    expectedDate?: string | null;
    entranceDate: string | null;
    exitDate?: string | null;
    plate: string | null;
    idCompany?: number;
    idState?: string;
    zone: string | null;
    idZone?: string;
    clientComment?: string | null;
    authStatus?: string;
    idMovement?: number;
    customStateAct?: string;
    state: string | null;
    duration: string | null;
    companyName: string | null;
};

export interface CauPredefinedResponse {
  id: string;
  title: string;
  responseText: string;
  status: CauRequestStatus;
}

export interface Widget {
  id: string;
  title: string;
  content: string;
}

export type VehicleType = 'Cabeza Tractora' | 'Semirremolque' | 'Piso Móvil' | 'Cisterna' | 'Frigorífico' | 'Lona' | 'Portacontenedores' | 'Cuba' | 'Bañera' | 'Portacoches' | 'Tautliner' | 'Motocicleta' | 'Turismo/Otros' | 'Furgoneta';
export type VehicleStatus = 'Activo' | 'Inactivo';

export interface FleetHistoryEntry {
  action: 'Alta' | 'Baja';
  performedAt: string;
  performedBy: string;
}

export interface Vehicle {
  plate: string;
  type: VehicleType;
  status: VehicleStatus;
  history: FleetHistoryEntry[];
  expiryDate?: string; // For support vehicles (annual authorization)
  companyId?: string;
  companyName?: string;
}

export interface Fleet {
  companyName: string;
  vehicles: Vehicle[];
}

export interface ImagePlaceholder {
  id: string;
  description: string;
  imageUrl: string;
  imageHint?: string;
}

export interface PedestrianAccessRequest {
  id: string;
  documentNumber: string; // DNI/NIE/Pasaporte
  fullName: string;
  phoneNumber: string;
  uti: string; // Tractora o Remolque
  visitDate: string;
  companyId: string;
  companyName: string;
  createdAt: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  placeholders: string[];
}

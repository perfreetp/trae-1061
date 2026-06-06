export interface User {
  id: string;
  name: string;
  role: 'riverChief' | 'patroler';
  phone: string;
  avatar?: string;
  department: string;
  responsibleRiver: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  riverName: string;
  riverSection: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'inProgress' | 'completed' | 'delayed' | 'overdue';
  type: 'routine' | 'special' | 'emergency';
  checkpoints: Checkpoint[];
  distance: number;
  createdAt: string;
  delayApplied?: boolean;
  delayReason?: string;
  delayApproved?: boolean;
}

export interface Checkpoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  checked: boolean;
  checkedAt?: string;
}

export interface Problem {
  id: string;
  taskId?: string;
  type: ProblemType;
  category?: string;
  description: string;
  images: string[];
  videos?: string[];
  voiceNote?: string;
  latitude: number;
  longitude: number;
  location: string;
  riverName: string;
  reporterId: string;
  reporterName: string;
  status: 'pending' | 'assigned' | 'rectifying' | 'completed' | 'verified';
  assigneeId?: string;
  assigneeName?: string;
  rectifyDeadline?: string;
  rectifyDescription?: string;
  rectifyImages?: string[];
  verifiedAt?: string;
  createdAt: string;
  isOffline?: boolean;
}

export type ProblemType = 
  | 'garbage' 
  | 'float' 
  | 'outlet' 
  | 'construction' 
  | 'sewage' 
  | 'illegal' 
  | 'other';

export interface GarbageCategory {
  id: string;
  name: string;
  icon: string;
}

export interface OutletRecord {
  id: string;
  name: string;
  type: 'rainwater' | 'sewage' | 'mixed';
  status: 'normal' | 'abnormal';
  abnormalReason?: string;
  flow?: string;
  waterColor?: string;
  odor?: boolean;
  latitude: number;
  longitude: number;
  images: string[];
  createdAt: string;
}

export interface ConstructionRecord {
  id: string;
  projectName: string;
  constructionUnit: string;
  startDate: string;
  endDate: string;
  status: 'ongoing' | 'completed';
  hasApproval: boolean;
  approvalNumber?: string;
  impactDescription?: string;
  images: string[];
  latitude: number;
  longitude: number;
  createdAt: string;
}

export interface WaterQualityRecord {
  id: string;
  riverName: string;
  location: string;
  latitude: number;
  longitude: number;
  temperature?: number;
  pH?: number;
  turbidity?: string;
  color?: string;
  odor?: string;
  floatingObjects?: boolean;
  oilFilm?: boolean;
  dissolvedOxygen?: number;
  ammoniaNitrogen?: number;
  description?: string;
  images: string[];
  recorderId: string;
  recorderName: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'task' | 'problem' | 'system' | 'urgent';
  relatedId?: string;
  read: boolean;
  createdAt: string;
}

export interface PatrolRecord {
  id: string;
  userId: string;
  taskId?: string;
  riverName: string;
  startTime: string;
  endTime?: string;
  distance: number;
  duration: number;
  checkpoints: Checkpoint[];
  problems: string[];
  routePoints: { latitude: number; longitude: number }[];
}

export interface Statistics {
  totalPatrols: number;
  totalDistance: number;
  totalProblems: number;
  completedProblems: number;
  overdueProblems: number;
  monthlyPatrols: { month: string; count: number; distance: number }[];
  problemTypes: { type: string; count: number }[];
  heatmapData: { latitude: number; longitude: number; count: number }[];
}

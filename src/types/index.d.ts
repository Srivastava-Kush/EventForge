/**
 * Core type declarations for Event Planner AI
 */

export type EventType = 'wedding' | 'birthday' | 'community';
export type SettingType = 'indoor' | 'outdoor' | 'hybrid';
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'INR';
export type BudgetTier = 'essential' | 'balanced' | 'elevated' | 'luxury';

export interface PlanInput {
  eventType: EventType;
  eventName?: string;
  date: string;
  guestCount: number;
  budget: number;
  currency: CurrencyCode;
  setting: SettingType;
  vibe?: string;
  priorities?: string[];
  considerations?: string[];
  honoreeAge?: number;
  notes?: string;
  useAI?: boolean;
}

export interface BudgetCategory {
  category: string;
  share: number;
  allocated: number;
  guidance: string;
}

export interface PlanBudget {
  total: number;
  currency: CurrencyCode;
  tier: BudgetTier;
  costPerGuest: number;
  categories: BudgetCategory[];
}

export interface TimelineTask {
  id: string;
  title: string;
  category: string;
  duePeriod: string;
  dueWeeksBefore: number;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  guidance: string;
  priority: 'high' | 'medium' | 'low';
}

export interface PlanVendor {
  id: string;
  name: string;
  category: string;
  priority: 'essential' | 'recommended' | 'optional';
  targetBudget: number;
  bookByPeriod: string;
  bookByDate: string;
  status: 'not_contacted' | 'contacted' | 'booked';
  tips: string;
}

export interface PlanInsight {
  area: string;
  headline: string;
  detail: string;
  actionable: string;
}

export interface EventPlan {
  summary: {
    eventType: EventType;
    eventName: string;
    date: string;
    guestCount: number;
    daysUntilEvent: number;
  };
  budget: PlanBudget;
  timeline: {
    tasks: TimelineTask[];
  };
  vendors: PlanVendor[];
  insights: PlanInsight[];
}

export interface UserPayload {
  _id: string;
  name: string;
  email: string;
}

export interface ITaskItem {
  id: string;
  title: string;
  phase?: string;
  dueDate?: string;
  urgent?: boolean;
  status: 'pending' | 'completed';
  completedAt?: Date | null;
  notes?: string;
  assignedTo?: string;
  isCustom?: boolean;
}

export interface IVendorItem {
  id: string;
  name: string;
  priority: 'essential' | 'recommended' | 'optional';
  matchesPriority?: boolean;
  bookBy?: string;
  bookNow?: boolean;
  tip?: string;
  bookingStatus: 'pending' | 'contacted' | 'booked' | 'declined';
  vendorName?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  quotationAmount?: number;
  agreedAmount?: number;
  paidAmount?: number;
  notes?: string;
  documents?: { name: string; url: string; uploadedAt: Date }[];
}

export interface IExpenseItem {
  id: string;
  title: string;
  category?: string;
  estimatedCost?: number;
  actualCost?: number;
  paidAmount?: number;
  status?: 'unpaid' | 'partially_paid' | 'paid';
  dueDate?: string;
  notes?: string;
  vendorId?: string;
  receiptUrl?: string;
}

export interface IGuestItem {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  rsvpStatus: 'pending' | 'attending' | 'declined';
  dietaryRestrictions?: string;
  plusOnes?: number;
  tableNumber?: string;
  notes?: string;
}

export interface IScheduleItem {
  id: string;
  time: string;
  title: string;
  description?: string;
  completed?: boolean;
}

export interface IEventDocument {
  _id: any;
  user: any;
  type: EventType;
  input: PlanInput;
  plan: EventPlan;
  tasks: ITaskItem[];
  vendors: IVendorItem[];
  expenses: IExpenseItem[];
  guests: IGuestItem[];
  schedule: IScheduleItem[];
  posters: any[];
  createdAt: Date;
  updatedAt: Date;
  save(): Promise<this>;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}


/**
 * Shared API contracts and entity types between backend and frontend
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
  phase?: string;
  duePeriod?: string;
  dueWeeksBefore?: number;
  dueDate: string;
  urgent?: boolean;
  status: 'pending' | 'in_progress' | 'completed';
  completedAt?: string | null;
  guidance?: string;
  notes?: string;
  assignedTo?: string;
  priority?: 'high' | 'medium' | 'low';
}

export interface PlanVendor {
  id: string;
  name: string;
  category?: string;
  priority: 'essential' | 'recommended' | 'optional';
  targetBudget?: number;
  bookByPeriod?: string;
  bookBy?: string;
  bookByDate?: string;
  bookNow?: boolean;
  status?: 'not_contacted' | 'contacted' | 'booked';
  bookingStatus?: 'pending' | 'contacted' | 'booked' | 'declined';
  tips?: string;
  tip?: string;
  vendorName?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  quotationAmount?: number;
  agreedAmount?: number;
  paidAmount?: number;
  notes?: string;
}

export interface ExpenseItem {
  id: string;
  title: string;
  category: string;
  estimatedCost: number;
  actualCost: number;
  paidAmount: number;
  status: 'unpaid' | 'partially_paid' | 'paid';
  dueDate?: string;
  notes?: string;
}

export interface GuestItem {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  group?: string;
  invitationStatus?: 'not_sent' | 'sent' | 'opened';
  rsvpStatus: 'pending' | 'attending' | 'declined' | 'tentative';
  plusOnes?: number;
  dietary?: string;
  tableOrSeating?: string;
  notes?: string;
}

export interface ScheduleItem {
  id: string;
  startTime: string;
  endTime?: string;
  activity: string;
  location?: string;
  responsiblePerson?: string;
  notes?: string;
  completed?: boolean;
}

export interface EventMetrics {
  budget: {
    totalBudget: number;
    totalActualCost: number;
    totalPaid: number;
    remainingBudget: number;
    currency: CurrencyCode;
  };
  tasks: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    completionPercentage: number;
  };
  vendors: {
    total: number;
    booked: number;
    pending: number;
    bookingPercentage: number;
  };
  guests: {
    totalInvited: number;
    attending: number;
    declined: number;
    pending: number;
  };
  overallProgress: number;
}

export interface EventEntity {
  _id: string;
  type: EventType;
  input: PlanInput;
  plan: {
    summary: {
      eventType: EventType;
      eventName: string;
      date: string;
      guestCount: number;
      daysUntilEvent?: number;
      daysToGo?: number;
    };
    budget: PlanBudget;
    timeline: {
      tasks: TimelineTask[];
    };
    vendors: PlanVendor[];
    insights: Array<{
      area: string;
      headline: string;
      detail: string;
      actionable: string;
    }>;
  };
  tasks: TimelineTask[];
  vendors: PlanVendor[];
  expenses: ExpenseItem[];
  guests: GuestItem[];
  schedule: ScheduleItem[];
  metrics: EventMetrics;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{ field?: string; message: string }>;
  requestId?: string;
}

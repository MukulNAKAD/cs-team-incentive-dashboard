// Auth types
export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: 'admin' | 'kam' | 'os' | 'rs';
    isActive: boolean;
    employee: {
      id: string;
      employeeId: string;
      name: string;
    };
  };
}

export interface RegisterUserDto {
  email: string;
  password: string;
  employeeId: string;
}

// Employee types
export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  designation: 'kam' | 'os' | 'rs';
  monthlyCost: number;
  companyJoiningDate: string;
  noticePeriodStart: string | null;
  noticePeriodEnd: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeDetail extends Employee {
  user: {
    id: string;
    email: string;
    role: 'admin' | 'kam' | 'os' | 'rs';
    isActive: boolean;
  } | null;
  podMemberships: {
    id: string;
    attributionPercentage: number;
    podJoiningDate: string;
    podLeavingDate: string | null;
    pod: {
      id: string;
      name: string;
    };
  }[];
}

export interface CreateEmployeeDto {
  employeeId: string;
  name: string;
  designation: 'kam' | 'os' | 'rs';
  monthlyCost: number;
  companyJoiningDate: string;
  noticePeriodStart?: string;
  noticePeriodEnd?: string;
}

export interface UpdateEmployeeDto {
  name?: string;
  designation?: 'kam' | 'os' | 'rs';
  monthlyCost?: number;
  companyJoiningDate?: string;
  noticePeriodStart?: string | null;
  noticePeriodEnd?: string | null;
}

// Client types
export interface Client {
  id: string;
  crmId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientDetail extends Client {
  employees: {
    id: string;
    employeeId: string;
    name: string;
    designation: 'kam' | 'os' | 'rs';
  }[];
}

export interface CreateClientDto {
  crmId: string;
  name: string;
}

export interface UpdateClientDto {
  name?: string;
}

export interface CreateClientMappingDto {
  clientId: string;
  employeeId: string;
  role: 'kam' | 'os' | 'rs';
  startDate: string;
  endDate?: string;
}

export interface UpdateClientMappingDto {
  employeeId?: string;
  endDate?: string;
}

export interface ClientMapping {
  id: string;
  role: 'kam' | 'os' | 'rs';
  startDate: string;
  endDate: string | null;
  client: {
    id: string;
    crmId: string;
    name: string;
  };
  employee: {
    id: string;
    employeeId: string;
    name: string;
    designation: 'kam' | 'os' | 'rs';
  };
  createdAt: string;
  updatedAt: string;
}

// Pod types
export interface Pod {
  id: string;
  name: string;
  kam: {
    id: string;
    employeeId: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PodDetail extends Pod {
  members: {
    id: string;
    attributionPercentage: number;
    podJoiningDate: string;
    podLeavingDate: string | null;
    employee: {
      id: string;
      employeeId: string;
      name: string;
      designation: 'kam' | 'os' | 'rs';
    };
  }[];
}

export interface CreatePodDto {
  name: string;
  kamId: string;
}

export interface UpdatePodDto {
  name?: string;
  kamId?: string;
}

export interface CreatePodMemberDto {
  employeeId: string;
  podId: string;
  attributionPercentage: number;
  podJoiningDate: string;
  podLeavingDate?: string;
}

export interface UpdatePodMemberDto {
  attributionPercentage?: number;
  podLeavingDate?: string;
}

export interface PodMember {
  id: string;
  attributionPercentage: number;
  podJoiningDate: string;
  podLeavingDate: string | null;
  employee: {
    id: string;
    employeeId: string;
    name: string;
    designation: 'kam' | 'os' | 'rs';
  };
  pod: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Revenue types
export interface Revenue {
  id: string;
  invoiceId: string;
  invoiceDate: string;
  serviceStartDate: string;
  serviceEndDate: string;
  preTaxTotal: number;
  totalAmount: number;
  client: {
    id: string;
    crmId: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface RevenueDetail extends Revenue {
  monthlyRevenues: {
    id: string;
    year: number;
    month: number;
    serviceDays: number;
    amount: number;
  }[];
}

export interface CreateRevenueDto {
  clientId: string;
  invoiceId: string;
  invoiceDate: string;
  serviceStartDate: string;
  serviceEndDate: string;
  preTaxTotal: number;
  totalAmount: number;
}

export interface ImportRevenueDto {
  revenues: {
    crmId: string;
    invoiceId: string;
    invoiceDate: string;
    serviceStartDate: string;
    serviceEndDate: string;
    preTaxTotal: number;
    totalAmount: number;
  }[];
}

export interface MonthlyRevenue {
  id: string;
  year: number;
  month: number;
  serviceDays: number;
  amount: number;
  revenue: {
    id: string;
    invoiceId: string;
    client: {
      id: string;
      crmId: string;
      name: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

// Target types
export interface Target {
  id: string;
  year: number;
  month: number;
  type: 'revenue' | 'gm';
  value: number;
  employee: {
    id: string;
    employeeId: string;
    name: string;
    designation: 'kam' | 'os' | 'rs';
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateTargetDto {
  employeeId: string;
  year: number;
  month: number;
  type: 'revenue' | 'gm';
  value: number;
}

export interface UpdateTargetDto {
  employeeId?: string;
  year?: number;
  month?: number;
  type?: 'revenue' | 'gm';
  value?: number;
}

export interface BulkCreateTargetDto {
  targets: {
    employeeId: string;
    year: number;
    month: number;
    type: 'revenue' | 'gm';
    value: number;
  }[];
}

// Incentive types
export interface Incentive {
  id: string;
  year: number;
  month: number;
  revenue: number;
  podCost: number | null;
  achievedGM: number | null;
  targetGM: number | null;
  targetAchievedPercentage: number;
  incentiveMultiplier: number;
  payout: number;
  arrears: number;
  totalPayout: number;
  isFrozen: boolean;
  employee: {
    id: string;
    employeeId: string;
    name: string;
    designation: 'kam' | 'os' | 'rs';
  };
  createdAt: string;
  updatedAt: string;
}

export interface GetIncentiveDto {
  employeeId: string;
  year: number;
  month: number;
}

export interface IncentiveCalculation {
  employeeId: string;
  employeeName: string;
  designation: 'kam' | 'os' | 'rs';
  year: number;
  month: number;
  revenue: number;
  podCost?: number;
  achievedGM?: number;
  previousAchievedGM?: number;
  targetGM?: number;
  previousTargetGM?: number;
  actualGMIncrease?: number;
  revisedTargetGMIncrease?: number;
  targetRevenue?: number;
  targetAchievedPercentage: number;
  incentiveMultiplier: number;
  payout: number;
  arrears: number;
  totalPayout: number;
}

export interface SaveIncentivesRequest extends IncentiveCalculation {}

export interface FreezeIncentiveDto {
  year: number;
  month: number;
  freeze: boolean;
}

// Cost types
export interface EmployeeCost {
  employeeId: string;
  employeeName: string;
  designation: 'kam' | 'os' | 'rs';
  monthlyCost: number;
  podId: string | null;
  podName: string | null;
  attributionPercentage: number;
  companyJoiningRationalization: number;
  podJoiningRationalization: number;
  noticePeriodRationalization: number;
  adjustedCost: number;
}

export interface PodCost {
  podId: string;
  podName: string;
  kamId: string;
  kamName: string;
  totalCost: number;
  members: {
    employeeId: string;
    employeeName: string;
    designation: 'kam' | 'os' | 'rs';
    monthlyCost: number;
    attributionPercentage: number;
    companyJoiningRationalization: number;
    podJoiningRationalization: number;
    noticePeriodRationalization: number;
    adjustedCost: number;
  }[];
}

// Import/Export types
export interface ImportResponse {
  success: number;
  failed: number;
  errors: string[];
}

export interface GenerateReportDto {
  type: 'incentive' | 'performance' | 'revenue' | 'cost';
  year: number;
  month: number;
  podId?: string;
  employeeId?: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  designation: string;
  email_verified: boolean;
  phone_num: string;
  bank: string;
  bank_acc_num: string;
  bank_ifsc: string;
  pan_num: string;
  created_at: Date;
  updated_at: Date;
}

export interface SALARY_SLIP_DATA_TYPE {
  basic: string;
  hra: string;
  special_allowance: string;
  gross_earnings: string;
  income_tax: string;
  pf: string;
  cess: string;
  total_deductions: string;
  net_pay: string;
  net_pay_words: string;
  paid_days: number;
  lop_days: number;
  employee_name: string;
  employee_id: string;
  designation: string;
  month: string;
  year: string;
  pay_date: string;
  pan: string;
  bank: string;
  account_no: string;
  ifsc: string;
}
export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

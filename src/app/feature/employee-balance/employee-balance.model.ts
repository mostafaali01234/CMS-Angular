// employee-balance.model.ts
export type MovementKind = 'salary' | 'installments' | 'withdraw' | 'loan';
export const MOVEMENT_LABELS: Record<MovementKind, string> = {
  salary: 'اعتماد مرتب', installments: 'اقساط سلف', withdraw: 'صرف مرتب', loan: 'سلفة',
};

export interface BalanceMovement {
  date: string; kind: MovementKind; description: string; amount: number; balance: number;
}
export interface EmployeeBalance {
  employee_id: number; employee_name: string; date_from: string | null; date_to: string | null;
  opening_balance: number; salaries_total: number; installments_total: number;
  withdrawn_total: number; loans_total: number; closing_balance: number;
  movements: BalanceMovement[];
}
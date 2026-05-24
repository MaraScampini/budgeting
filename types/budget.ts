export type PersonId = 'mara' | 'pau'

export type AccountType = 'checking' | 'saving' | 'cash'
export type CategoryKind = 'expense' | 'income' | 'transfer' | 'saving'
export type TransactionKind = 'expense' | 'income' | 'transfer' | 'bill' | 'settlement'
export type BillAmountType = 'fixed' | 'variable'
export type BillStatus = 'paid' | 'unpaid'

export interface Person {
  id: PersonId
  name: string
  color: string
}

export interface Account {
  id: string
  name: string
  type: AccountType
  owner: PersonId | 'joint'
  balance: number
  lastChecked?: string
}

export interface Category {
  id: string
  name: string
  kind: CategoryKind
  owner: PersonId | 'joint'
  defaultAccountId: string
  color: string
}

export interface Transaction {
  id: string
  date: string
  kind: TransactionKind
  description: string
  amount: number
  accountId: string
  categoryId?: string
  paidBy?: PersonId | 'joint'
  split?: SplitRule
  billInstanceId?: string
}

export interface SplitRule {
  enabled: boolean
  maraShare: number
  pauShare: number
  settled: boolean
}

export interface RecurringBill {
  id: string
  name: string
  categoryId: string
  accountId: string
  dueDay: number
  amountType: BillAmountType
  expectedAmount: number
  owner: PersonId | 'joint'
}

export interface BillInstance {
  id: string
  recurringBillId: string
  month: string
  dueDate: string
  amount: number
  status: BillStatus
}

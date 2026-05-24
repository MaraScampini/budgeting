import type {
  Account,
  BillInstance,
  Category,
  Person,
  PersonId,
  RecurringBill,
  SplitRule,
  Transaction
} from '~/types/budget'

const todayIso = () => new Date().toISOString().slice(0, 10)
const monthKey = (date = todayIso()) => date.slice(0, 7)
const eur = (value: number) => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(value)

const peopleSeed: Person[] = [
  { id: 'mara', name: 'Mara', color: '#e85d75' },
  { id: 'pau', name: 'Pau', color: '#247c91' }
]

const accountsSeed: Account[] = [
  { id: 'mara-daily', name: 'Mara daily', type: 'checking', owner: 'mara', balance: 1069.89, lastChecked: '2026-01-02' },
  { id: 'mara-savings', name: 'Mara savings', type: 'saving', owner: 'mara', balance: 7578.53, lastChecked: '2026-01-02' },
  { id: 'joint', name: 'Joint', type: 'checking', owner: 'joint', balance: 506.68, lastChecked: '2026-01-02' },
  { id: 'pau-daily', name: 'Pau daily', type: 'checking', owner: 'pau', balance: 488.37, lastChecked: '2026-01-03' },
  { id: 'pau-savings', name: 'Pau savings', type: 'saving', owner: 'pau', balance: 13000.1, lastChecked: '2026-01-03' },
  { id: 'joint-savings', name: 'Joint savings', type: 'saving', owner: 'joint', balance: 885.1 }
]

const categoriesSeed: Category[] = [
  { id: 'groceries', name: 'Groceries', kind: 'expense', owner: 'joint', defaultAccountId: 'joint', color: '#6f9f73' },
  { id: 'bills', name: 'Bills', kind: 'expense', owner: 'joint', defaultAccountId: 'joint', color: '#e0a22f' },
  { id: 'mara-fun', name: 'Mara fun money', kind: 'expense', owner: 'mara', defaultAccountId: 'mara-daily', color: '#e85d75' },
  { id: 'mara-transport', name: 'Mara transport', kind: 'expense', owner: 'mara', defaultAccountId: 'mara-daily', color: '#b76bd8' },
  { id: 'pau-fun', name: 'Pau fun money', kind: 'expense', owner: 'pau', defaultAccountId: 'pau-daily', color: '#247c91' },
  { id: 'pau-transport', name: 'Pau transport', kind: 'expense', owner: 'pau', defaultAccountId: 'pau-daily', color: '#5796d1' },
  { id: 'home', name: 'Home bits', kind: 'expense', owner: 'joint', defaultAccountId: 'joint', color: '#c87538' },
  { id: 'savings', name: 'Savings', kind: 'saving', owner: 'joint', defaultAccountId: 'joint-savings', color: '#576f53' }
]

const billsSeed: RecurringBill[] = [
  { id: 'rent', name: 'Rent', categoryId: 'bills', accountId: 'joint', dueDay: 1, amountType: 'fixed', expectedAmount: 1200, owner: 'joint' },
  { id: 'internet', name: 'Internet', categoryId: 'bills', accountId: 'joint', dueDay: 5, amountType: 'fixed', expectedAmount: 39.99, owner: 'joint' },
  { id: 'electricity', name: 'Light and gas', categoryId: 'bills', accountId: 'joint', dueDay: 18, amountType: 'variable', expectedAmount: 95, owner: 'joint' },
  { id: 'spotify', name: 'Spotify', categoryId: 'bills', accountId: 'mara-daily', dueDay: 20, amountType: 'fixed', expectedAmount: 10.99, owner: 'mara' }
]

const billInstancesSeed: BillInstance[] = billsSeed.map((bill) => ({
  id: `${bill.id}-${monthKey()}`,
  recurringBillId: bill.id,
  month: monthKey(),
  dueDate: `${monthKey()}-${String(bill.dueDay).padStart(2, '0')}`,
  amount: bill.expectedAmount,
  status: bill.dueDay < Number(todayIso().slice(8, 10)) && bill.id !== 'rent' ? 'unpaid' : 'paid'
}))

const transactionsSeed: Transaction[] = [
  { id: 't1', date: `${monthKey()}-02`, kind: 'income', description: 'Mara salary', amount: 2400, accountId: 'mara-daily', paidBy: 'mara' },
  { id: 't2', date: `${monthKey()}-05`, kind: 'income', description: 'Pau salary', amount: 2300, accountId: 'pau-daily', paidBy: 'pau' },
  { id: 't3', date: `${monthKey()}-08`, kind: 'expense', description: 'Weekly shop', amount: 86.3, accountId: 'joint', categoryId: 'groceries', paidBy: 'joint' },
  { id: 't4', date: `${monthKey()}-10`, kind: 'expense', description: 'Dinner split', amount: 62, accountId: 'mara-daily', categoryId: 'mara-fun', paidBy: 'mara', split: { enabled: true, maraShare: 31, pauShare: 31, settled: false } },
  { id: 't5', date: `${monthKey()}-12`, kind: 'expense', description: 'Metro card', amount: 21.4, accountId: 'pau-daily', categoryId: 'pau-transport', paidBy: 'pau' },
  { id: 't6', date: `${monthKey()}-13`, kind: 'expense', description: 'Plants and shelves', amount: 74.2, accountId: 'joint', categoryId: 'home', paidBy: 'joint' },
  { id: 't7', date: `${monthKey()}-14`, kind: 'expense', description: 'Cinema', amount: 18, accountId: 'pau-daily', categoryId: 'pau-fun', paidBy: 'pau' },
  { id: 't8', date: `${monthKey()}-15`, kind: 'expense', description: 'Brunch', amount: 42.5, accountId: 'mara-daily', categoryId: 'mara-fun', paidBy: 'mara' },
  { id: 't9', date: `${monthKey()}-16`, kind: 'expense', description: 'Second weekly shop', amount: 93.7, accountId: 'joint', categoryId: 'groceries', paidBy: 'joint' },
  { id: 't10', date: `${monthKey()}-17`, kind: 'expense', description: 'Bus pass top-up', amount: 20, accountId: 'mara-daily', categoryId: 'mara-transport', paidBy: 'mara' },
  { id: 't11', date: `${monthKey()}-18`, kind: 'expense', description: 'Rent', amount: 1200, accountId: 'joint', categoryId: 'bills', paidBy: 'joint', billInstanceId: `rent-${monthKey()}` },
  { id: 't12', date: `${monthKey()}-18`, kind: 'expense', description: 'Savings transfer', amount: 278, accountId: 'joint', categoryId: 'savings', paidBy: 'joint' }
]

export const useBudgetStore = () => {
  const people = useState<Person[]>('people', () => peopleSeed)
  const accounts = useState<Account[]>('accounts', () => accountsSeed)
  const categories = useState<Category[]>('categories', () => categoriesSeed)
  const recurringBills = useState<RecurringBill[]>('recurring-bills', () => billsSeed)
  const billInstances = useState<BillInstance[]>('bill-instances', () => billInstancesSeed)
  const transactions = useState<Transaction[]>('transactions', () => transactionsSeed)
  const selectedMonth = useState<string>('selected-month', () => monthKey())
  const storageKey = 'mara-pau-budget-demo-state-v2'
  const isLoaded = useState<boolean>('budget-demo-loaded', () => false)

  if (import.meta.client && !isLoaded.value) {
    const saved = window.localStorage.getItem(storageKey)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        people.value = parsed.people || people.value
        accounts.value = parsed.accounts || accounts.value
        categories.value = parsed.categories || categories.value
        recurringBills.value = parsed.recurringBills || recurringBills.value
        billInstances.value = parsed.billInstances || billInstances.value
        transactions.value = parsed.transactions || transactions.value
        selectedMonth.value = parsed.selectedMonth || selectedMonth.value
      } catch {
        window.localStorage.removeItem(storageKey)
      }
    }
    isLoaded.value = true
  }

  if (import.meta.client) {
    watch([people, accounts, categories, recurringBills, billInstances, transactions, selectedMonth], () => {
      window.localStorage.setItem(storageKey, JSON.stringify({
        people: people.value,
        accounts: accounts.value,
        categories: categories.value,
        recurringBills: recurringBills.value,
        billInstances: billInstances.value,
        transactions: transactions.value,
        selectedMonth: selectedMonth.value
      }))
    }, { deep: true })
  }

  const monthTransactions = computed(() => transactions.value.filter((transaction) => transaction.date.startsWith(selectedMonth.value)))
  const totalBalance = computed(() => accounts.value.reduce((sum, account) => sum + account.balance, 0))
  const checkingBalance = computed(() => accounts.value.filter((account) => account.type === 'checking').reduce((sum, account) => sum + account.balance, 0))
  const savingBalance = computed(() => accounts.value.filter((account) => account.type === 'saving').reduce((sum, account) => sum + account.balance, 0))

  const spentByPerson = computed(() => {
    const totals: Record<PersonId | 'joint', number> = { mara: 0, pau: 0, joint: 0 }
    for (const transaction of monthTransactions.value) {
      if (transaction.kind !== 'expense' && transaction.kind !== 'bill') continue
      const account = accounts.value.find((item) => item.id === transaction.accountId)
      totals[transaction.paidBy || account?.owner || 'joint'] += transaction.amount
    }
    return totals
  })

  const categoryTotals = computed(() => categories.value.map((category) => {
    const total = monthTransactions.value
      .filter((transaction) => transaction.categoryId === category.id && (transaction.kind === 'expense' || transaction.kind === 'bill'))
      .reduce((sum, transaction) => sum + transaction.amount, 0)

    return { ...category, total }
  }).filter((category) => category.total > 0).sort((a, b) => b.total - a.total))

  const unpaidBills = computed(() => billInstances.value
    .filter((bill) => bill.month === selectedMonth.value && bill.status === 'unpaid')
    .map((instance) => ({ ...instance, bill: recurringBills.value.find((bill) => bill.id === instance.recurringBillId)! }))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate)))

  const splitStanding = computed(() => {
    let pauOwesMara = 0
    let maraOwesPau = 0

    for (const transaction of transactions.value) {
      if (!transaction.split?.enabled || transaction.split.settled) continue
      if (transaction.paidBy === 'mara') pauOwesMara += transaction.split.pauShare
      if (transaction.paidBy === 'pau') maraOwesPau += transaction.split.maraShare
    }

    return { pauOwesMara, maraOwesPau, net: pauOwesMara - maraOwesPau }
  })

  const addExpense = (input: {
    amount: number
    categoryId: string
    accountId: string
    date: string
    description: string
    paidBy: PersonId | 'joint'
    split?: SplitRule
  }) => {
    const transaction: Transaction = {
      id: crypto.randomUUID(),
      kind: 'expense',
      ...input
    }

    transactions.value = [transaction, ...transactions.value]
    accounts.value = accounts.value.map((account) => account.id === input.accountId
      ? { ...account, balance: account.balance - input.amount }
      : account)
  }

  const markBillPaid = (instanceId: string, amount?: number) => {
    const instance = billInstances.value.find((item) => item.id === instanceId)
    if (!instance) return

    const bill = recurringBills.value.find((item) => item.id === instance.recurringBillId)
    if (!bill) return

    const actualAmount = amount || instance.amount
    billInstances.value = billInstances.value.map((item) => item.id === instanceId
      ? { ...item, amount: actualAmount, status: 'paid' }
      : item)

    transactions.value = [{
      id: crypto.randomUUID(),
      date: todayIso(),
      kind: 'bill',
      description: bill.name,
      amount: actualAmount,
      accountId: bill.accountId,
      categoryId: bill.categoryId,
      paidBy: bill.owner,
      billInstanceId: instanceId
    }, ...transactions.value]

    accounts.value = accounts.value.map((account) => account.id === bill.accountId
      ? { ...account, balance: account.balance - actualAmount }
      : account)
  }

  const settleSplit = (transactionId: string) => {
    transactions.value = transactions.value.map((transaction) => transaction.id === transactionId && transaction.split
      ? { ...transaction, split: { ...transaction.split, settled: true } }
      : transaction)
  }

  const addCategory = (category: Omit<Category, 'id'>) => {
    categories.value = [{ id: crypto.randomUUID(), ...category }, ...categories.value]
  }

  const deleteCategory = (categoryId: string) => {
    categories.value = categories.value.filter((category) => category.id !== categoryId)
  }

  return {
    people,
    accounts,
    categories,
    recurringBills,
    billInstances,
    transactions,
    selectedMonth,
    monthTransactions,
    totalBalance,
    checkingBalance,
    savingBalance,
    spentByPerson,
    categoryTotals,
    unpaidBills,
    splitStanding,
    addExpense,
    markBillPaid,
    settleSplit,
    addCategory,
    deleteCategory,
    eur,
    todayIso
  }
}

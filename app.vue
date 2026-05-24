<script setup lang="ts">
import type { PersonId, SplitRule } from '~/types/budget'

const store = useBudgetStore()
const config = useRuntimeConfig()

const Icon = defineComponent({
  props: {
    name: { type: String, required: true },
    size: { type: Number, default: 18 }
  },
  setup(props) {
    const labels: Record<string, string> = {
      add: '+',
      bills: '€',
      calendar: '31',
      chart: '%',
      check: '✓',
      euro: '€',
      home: '⌂',
      savings: '€',
      settings: '⚙',
      sliders: '=',
      split: '↕',
      trash: '×',
      users: '2'
    }

    return () => h('span', {
      class: ['ui-icon', `ui-icon-${props.name}`],
      style: {
        width: `${props.size}px`,
        height: `${props.size}px`,
        fontSize: `${Math.max(11, props.size * 0.62)}px`
      },
      'aria-hidden': 'true'
    }, labels[props.name] || '•')
  }
})

const activeView = ref<'home' | 'summary' | 'settings'>('home')
const selectedCategoryId = ref(store.categories.value[0]?.id || '')
const selectedCategory = computed(() => store.categories.value.find((category) => category.id === selectedCategoryId.value))
const selectedAccountId = ref(selectedCategory.value?.defaultAccountId || 'joint')
const amount = ref<number | null>(null)
const date = ref(store.todayIso())
const description = ref('')
const paidBy = ref<PersonId | 'joint'>('joint')
const splitMode = ref<'none' | 'fifty'>('none')
const newCategoryName = ref('')
const newCategoryOwner = ref<PersonId | 'joint'>('joint')
const supabaseReady = computed(() => Boolean(config.public.supabaseKey || config.public.supabase?.key))

watch(selectedCategoryId, () => {
  if (!selectedCategory.value) return
  selectedAccountId.value = selectedCategory.value.defaultAccountId
  paidBy.value = selectedCategory.value.owner
})

const saveExpense = () => {
  if (!amount.value || amount.value <= 0 || !selectedCategory.value) return

  const split: SplitRule | undefined = splitMode.value === 'fifty'
    ? { enabled: true, maraShare: amount.value / 2, pauShare: amount.value / 2, settled: false }
    : undefined

  store.addExpense({
    amount: amount.value,
    categoryId: selectedCategoryId.value,
    accountId: selectedAccountId.value,
    date: date.value,
    description: description.value || selectedCategory.value.name,
    paidBy: paidBy.value,
    split
  })

  amount.value = null
  description.value = ''
  splitMode.value = 'none'
}

const addCategory = () => {
  if (!newCategoryName.value.trim()) return

  const defaultAccountId = newCategoryOwner.value === 'mara'
    ? 'mara-daily'
    : newCategoryOwner.value === 'pau'
      ? 'pau-daily'
      : 'joint'

  store.addCategory({
    name: newCategoryName.value.trim(),
    kind: 'expense',
    owner: newCategoryOwner.value,
    defaultAccountId,
    color: newCategoryOwner.value === 'mara' ? '#e85d75' : newCategoryOwner.value === 'pau' ? '#247c91' : '#6f9f73'
  })

  newCategoryName.value = ''
}

const openSplits = computed(() => store.transactions.value.filter((transaction) => transaction.split?.enabled && !transaction.split.settled))
const monthlySpent = computed(() => store.monthTransactions.value
  .filter((transaction) => transaction.kind === 'expense' || transaction.kind === 'bill')
  .reduce((sum, transaction) => sum + transaction.amount, 0))
const billsPaid = computed(() => store.billInstances.value.filter((bill) => bill.month === store.selectedMonth.value && bill.status === 'paid'))
const monthlyBillsTotal = computed(() => billsPaid.value.reduce((sum, bill) => sum + bill.amount, 0) + store.unpaidBills.value.reduce((sum, item) => sum + item.amount, 0))
const savingsAdded = computed(() => store.monthTransactions.value
  .filter((transaction) => transaction.categoryId === 'savings')
  .reduce((sum, transaction) => sum + transaction.amount, 0))
const monthlyBudget = computed(() => ({
  groceries: 420,
  bills: 1450,
  'mara-fun': 150,
  'mara-transport': 80,
  'pau-fun': 150,
  'pau-transport': 80,
  home: 180,
  savings: 1600
}))
const categoryBudgetRows = computed(() => store.categories.value.map((category) => {
  const spent = store.monthTransactions.value
    .filter((transaction) => transaction.categoryId === category.id && (transaction.kind === 'expense' || transaction.kind === 'bill'))
    .reduce((sum, transaction) => sum + transaction.amount, 0)
  const budget = monthlyBudget.value[category.id as keyof typeof monthlyBudget.value] || 0
  const left = budget - spent
  const percent = budget > 0 ? Math.min((spent / budget) * 100, 130) : 0

  return { ...category, spent, budget, left, percent }
}).sort((a, b) => {
  if (a.owner === b.owner) return b.spent - a.spent
  return a.owner.localeCompare(b.owner)
}))
const totalBudgeted = computed(() => categoryBudgetRows.value.reduce((sum, category) => sum + category.budget, 0))
const totalLeft = computed(() => totalBudgeted.value - monthlySpent.value)
const savingsPlan = computed(() => [
  { id: 'mara-leftover', name: 'Mara leftover sweep', owner: 'Mara', timing: 'After next salary', planned: 750, actual: 500, accent: '#e85d75' },
  { id: 'pau-payday', name: 'Pau payday saving', owner: 'Pau', timing: 'Salary day', planned: 500, actual: 589.94, accent: '#247c91' },
  { id: 'joint-pocket', name: 'Joint leftover pocket', owner: 'Joint', timing: 'After joint transfer', planned: 250, actual: 278, accent: '#576f53' },
  { id: 'vacation-pocket', name: 'Vacation pocket', owner: 'Mara', timing: 'Flexible monthly cushion', planned: 150, actual: 100, accent: '#d79a28' }
])
const plannedSavings = computed(() => savingsPlan.value.reduce((sum, item) => sum + item.planned, 0))
const actualSavings = computed(() => savingsPlan.value.reduce((sum, item) => sum + item.actual, 0))
const accountGroups = computed(() => [
  { id: 'daily', title: 'Daily money', accounts: store.accounts.value.filter((account) => account.type === 'checking') },
  { id: 'saving', title: 'Savings', accounts: store.accounts.value.filter((account) => account.type === 'saving') }
])
</script>

<template>
  <main class="shell">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">
          <Icon name="home" :size="22" />
        </div>
        <div>
          <strong>Mara & Pau</strong>
          <span>House budget</span>
        </div>
      </div>

      <nav class="desktop-nav">
        <button :class="{ active: activeView === 'home' }" @click="activeView = 'home'">
          <Icon name="add" :size="18" /> Quick add
        </button>
        <button :class="{ active: activeView === 'summary' }" @click="activeView = 'summary'">
          <Icon name="chart" :size="18" /> Summary
        </button>
        <button :class="{ active: activeView === 'settings' }" @click="activeView = 'settings'">
          <Icon name="settings" :size="18" /> Settings
        </button>
      </nav>
    </aside>

    <section class="workspace">
      <header class="topbar">
        <div>
          <p>{{ activeView === 'home' ? 'Today' : activeView === 'summary' ? 'Overview' : 'Configuration' }}</p>
          <h1>{{ activeView === 'home' ? 'Add spending fast' : activeView === 'summary' ? 'May standing' : 'Budget setup' }}</h1>
        </div>
        <label class="month-picker">
          <Icon name="calendar" :size="18" />
          <input v-model="store.selectedMonth.value" type="month" />
        </label>
      </header>

      <div v-if="activeView === 'home'" class="home-grid">
        <section v-if="!supabaseReady" class="panel setup-note">
          <strong>Demo mode</strong>
          <span>Add your Supabase browser key in <code>.env</code> to sync this UI with the project database. Entries are saved locally in this browser for now.</span>
        </section>

        <section class="panel quick-add">
          <div class="section-title">
            <Icon name="euro" :size="20" />
            <h2>Quick expense</h2>
          </div>

          <label class="amount-field">
            <span>Amount</span>
            <input v-model.number="amount" inputmode="decimal" min="0" placeholder="0.00" type="number" />
          </label>

          <div class="field-grid">
            <label>
              <span>Category</span>
              <select v-model="selectedCategoryId">
                <option v-for="category in store.categories.value" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select>
            </label>

            <label>
              <span>Account</span>
              <select v-model="selectedAccountId">
                <option v-for="account in store.accounts.value" :key="account.id" :value="account.id">
                  {{ account.name }}
                </option>
              </select>
            </label>

            <label>
              <span>Date</span>
              <input v-model="date" type="date" />
            </label>

            <label>
              <span>Paid by</span>
              <select v-model="paidBy">
                <option value="joint">Joint</option>
                <option value="mara">Mara</option>
                <option value="pau">Pau</option>
              </select>
            </label>
          </div>

          <label>
            <span>Note</span>
            <input v-model="description" placeholder="Mercadona, metro, dinner..." />
          </label>

          <div class="segmented">
            <button :class="{ active: splitMode === 'none' }" @click="splitMode = 'none'">No split</button>
            <button :class="{ active: splitMode === 'fifty' }" @click="splitMode = 'fifty'">
              <Icon name="users" :size="16" /> 50/50
            </button>
          </div>

          <button class="primary-action" @click="saveExpense">
            <Icon name="check" :size="19" /> Save expense
          </button>
        </section>

        <section class="panel attention">
          <div class="section-title">
            <Icon name="bills" :size="20" />
            <h2>Needs attention</h2>
          </div>

          <div v-if="store.unpaidBills.value.length" class="bill-list">
            <article v-for="item in store.unpaidBills.value" :key="item.id" class="bill-row">
              <div>
                <strong>{{ item.bill.name }}</strong>
                <span>Due {{ item.dueDate }} from {{ store.accounts.value.find((account) => account.id === item.bill.accountId)?.name }}</span>
              </div>
              <button @click="store.markBillPaid(item.id)">
                <Icon name="check" :size="16" /> {{ store.eur(item.amount) }}
              </button>
            </article>
          </div>
          <p v-else class="empty-copy">No overdue bills for this month.</p>
        </section>

        <section class="panel splits-card">
          <div class="section-title">
            <Icon name="split" :size="20" />
            <h2>Between you</h2>
          </div>
          <div class="standing">
            <span v-if="store.splitStanding.value.net > 0">Pau owes Mara</span>
            <span v-else-if="store.splitStanding.value.net < 0">Mara owes Pau</span>
            <span v-else>All even</span>
            <strong>{{ store.eur(Math.abs(store.splitStanding.value.net)) }}</strong>
          </div>
        </section>
      </div>

      <div v-if="activeView === 'summary'" class="summary-grid">
        <section class="panel spending-hero">
          <div>
            <span>Total spent this month</span>
            <strong>{{ store.eur(monthlySpent) }}</strong>
            <small>{{ store.eur(totalLeft) }} left of {{ store.eur(totalBudgeted) }} planned</small>
          </div>
          <div class="spending-hero-grid">
            <div>
              <span>Mara spending</span>
              <strong>{{ store.eur(store.spentByPerson.value.mara) }}</strong>
            </div>
            <div>
              <span>Pau spending</span>
              <strong>{{ store.eur(store.spentByPerson.value.pau) }}</strong>
            </div>
            <div>
              <span>Joint spending</span>
              <strong>{{ store.eur(store.spentByPerson.value.joint) }}</strong>
            </div>
          </div>
        </section>

        <section class="panel category-budget-panel">
          <div class="section-title">
            <Icon name="chart" :size="20" />
            <h2>Category budgets</h2>
          </div>
          <article v-for="category in categoryBudgetRows" :key="category.id" class="budget-row" :class="{ over: category.left < 0 }">
            <div class="budget-row-top">
              <div>
                <strong>{{ category.name }}</strong>
                <span>{{ category.owner }}</span>
              </div>
              <div class="budget-row-money">
                <strong>{{ store.eur(category.spent) }}</strong>
                <span>of {{ store.eur(category.budget) }}</span>
              </div>
            </div>
            <progress :value="category.spent" :max="category.budget || 1" :style="{ '--bar': category.left < 0 ? '#c44f4f' : category.color }" />
            <div class="budget-row-bottom">
              <span>{{ category.left >= 0 ? `${store.eur(category.left)} left` : `${store.eur(Math.abs(category.left))} over` }}</span>
              <span>{{ Math.round(category.percent) }}%</span>
            </div>
          </article>
        </section>

        <div class="summary-pair">
          <section class="panel bills-summary">
          <div class="section-title">
            <Icon name="bills" :size="20" />
            <h2>Bills and subscriptions</h2>
          </div>
          <article v-for="bill in store.billInstances.value" :key="bill.id" class="bill-summary-row" :class="bill.status">
            <div>
              <strong>{{ store.recurringBills.value.find((item) => item.id === bill.recurringBillId)?.name }}</strong>
              <span>{{ bill.dueDate }} · {{ store.recurringBills.value.find((item) => item.id === bill.recurringBillId)?.amountType }}</span>
            </div>
            <div>
              <strong>{{ store.eur(bill.amount) }}</strong>
              <small>{{ bill.status }}</small>
            </div>
          </article>
          </section>

          <section class="panel savings-summary">
          <div class="section-title">
            <Icon name="savings" :size="20" />
            <h2>Monthly savings</h2>
          </div>
          <div class="saving-total-row">
            <div>
              <span>Projected</span>
              <strong>{{ store.eur(plannedSavings) }}</strong>
            </div>
            <div>
              <span>Actual</span>
              <strong>{{ store.eur(actualSavings) }}</strong>
            </div>
          </div>
          <article v-for="item in savingsPlan" :key="item.id" class="saving-row">
            <div class="saving-row-top">
              <div>
                <strong>{{ item.name }}</strong>
                <span>{{ item.owner }} · {{ item.timing }}</span>
              </div>
              <strong>{{ store.eur(item.actual) }}</strong>
            </div>
            <progress :value="item.actual" :max="item.planned" :style="{ '--bar': item.accent }" />
            <div class="budget-row-bottom">
              <span>planned {{ store.eur(item.planned) }}</span>
              <span>{{ item.actual >= item.planned ? 'on track' : `${store.eur(item.planned - item.actual)} remaining` }}</span>
            </div>
          </article>
          </section>
        </div>

        <section class="panel account-list">
          <div class="section-title">
            <Icon name="savings" :size="20" />
            <h2>Account balances</h2>
          </div>
          <div v-for="group in accountGroups" :key="group.id" class="account-group">
            <div class="group-heading">
              <span>{{ group.title }}</span>
              <strong>{{ store.eur(group.accounts.reduce((sum, account) => sum + account.balance, 0)) }}</strong>
            </div>
            <article v-for="account in group.accounts" :key="account.id" class="account-row">
              <div>
                <strong>{{ account.name }}</strong>
                <span>{{ account.owner }} · checked {{ account.lastChecked || 'not yet' }}</span>
              </div>
              <strong>{{ store.eur(account.balance) }}</strong>
            </article>
          </div>
        </section>
      </div>

      <div v-if="activeView === 'settings'" class="settings-grid">
        <section class="panel setup-panel">
          <div class="section-title">
            <Icon name="settings" :size="20" />
            <h2>Supabase connection</h2>
          </div>
          <div class="connection-row">
            <span>Project URL</span>
            <strong>{{ config.public.supabaseUrl || config.public.supabase?.url || 'Not configured' }}</strong>
          </div>
          <div class="connection-row">
            <span>Browser key</span>
            <strong>{{ supabaseReady ? 'Configured' : 'Missing' }}</strong>
          </div>
          <p class="empty-copy">Schema migration is in <code>supabase/migrations</code>. Once the MCP SQL tool is available in this session, I can apply it directly to the project.</p>
        </section>

        <section class="panel">
          <div class="section-title">
            <Icon name="sliders" :size="20" />
            <h2>Categories</h2>
          </div>

          <div class="inline-form">
            <input v-model="newCategoryName" placeholder="New category" />
            <select v-model="newCategoryOwner">
              <option value="joint">Joint</option>
              <option value="mara">Mara</option>
              <option value="pau">Pau</option>
            </select>
            <button @click="addCategory">
              <Icon name="add" :size="17" /> Add
            </button>
          </div>

          <article v-for="category in store.categories.value" :key="category.id" class="category-row">
            <span :style="{ background: category.color }" />
            <div>
              <strong>{{ category.name }}</strong>
              <small>{{ category.owner }} · default {{ store.accounts.value.find((account) => account.id === category.defaultAccountId)?.name }}</small>
            </div>
            <button class="icon-button" @click="store.deleteCategory(category.id)" aria-label="Delete category">
              <Icon name="trash" :size="17" />
            </button>
          </article>
        </section>

        <section class="panel">
          <div class="section-title">
            <Icon name="bills" :size="20" />
            <h2>Recurring bills</h2>
          </div>
          <article v-for="bill in store.recurringBills.value" :key="bill.id" class="bill-row static">
            <div>
              <strong>{{ bill.name }}</strong>
              <span>Day {{ bill.dueDay }} · {{ bill.amountType }} · {{ store.accounts.value.find((account) => account.id === bill.accountId)?.name }}</span>
            </div>
            <strong>{{ store.eur(bill.expectedAmount) }}</strong>
          </article>
        </section>
      </div>
    </section>

    <nav class="mobile-nav">
      <button :class="{ active: activeView === 'home' }" @click="activeView = 'home'">
        <Icon name="add" :size="20" /><span>Add</span>
      </button>
      <button :class="{ active: activeView === 'summary' }" @click="activeView = 'summary'">
        <Icon name="chart" :size="20" /><span>Summary</span>
      </button>
      <button :class="{ active: activeView === 'settings' }" @click="activeView = 'settings'">
        <Icon name="settings" :size="20" /><span>Settings</span>
      </button>
    </nav>
  </main>
</template>

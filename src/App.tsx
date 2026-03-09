import { useState, useEffect } from 'react'
import './App.css'

// ─── Types ────────────────────────────────────────────────────────────────────

type Currency = 'TWD' | 'KRW' | 'USD'
type Page = 'buy' | 'expense' | 'report'

interface Product {
  id: string
  name: string
  currency: Currency
  price: number
  quantity: number
  exchangeRate: number
  weight: number
}

interface Expense {
  id: string
  category: string
  amount: number
  currency: Currency
  exchangeRate: number
  note: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EXPENSE_CATEGORIES = [
  '排隊薪水', '機票', '住宿', '計程車', '運費', '網卡', '機場接送', '地鐵', '其他',
]
const CURRENCIES: Currency[] = ['TWD', 'KRW', 'USD']
const CURRENCY_LABELS: Record<Currency, string> = {
  TWD: '台幣 TWD',
  KRW: '韓元 KRW',
  USD: '美金 USD',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function fmt(n: number) {
  return Math.round(n).toLocaleString('zh-TW')
}

function productTWD(p: Product) {
  return p.price * p.quantity * p.exchangeRate
}

function expenseTWD(e: Expense) {
  return e.amount * e.exchangeRate
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconPlus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4v16m8-8H4" />
  </svg>
)

const IconEdit = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const IconTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const IconClose = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 18L18 6M6 6l12 12" />
  </svg>
)

// ─── Bottom Nav ───────────────────────────────────────────────────────────────

function BottomNav({
  page,
  setPage,
  productCount,
  expenseCount,
}: {
  page: Page
  setPage: (p: Page) => void
  productCount: number
  expenseCount: number
}) {
  const tabs: { key: Page; label: string; count?: number; icon: React.ReactNode }[] = [
    {
      key: 'buy',
      label: '買貨',
      count: productCount,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
    },
    {
      key: 'expense',
      label: '記帳',
      count: expenseCount,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 2.5 2 2.5-2 3.5 2z" />
        </svg>
      ),
    },
    {
      key: 'report',
      label: '報表',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
  ]

  return (
    <nav className="bottom-nav" role="navigation" aria-label="主導航">
      {tabs.map((t) => (
        <button
          key={t.key}
          className={`nav-tab${page === t.key ? ' active' : ''}`}
          onClick={() => setPage(t.key)}
          aria-label={t.label}
          aria-current={page === t.key ? 'page' : undefined}
        >
          <span className="nav-icon">{t.icon}</span>
          <span className="nav-label">{t.label}</span>
          {t.count !== undefined && t.count > 0 && (
            <span className="nav-badge">{t.count}</span>
          )}
        </button>
      ))}
    </nav>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  // Lock background scroll when modal is open
  useEffect(() => {
    document.documentElement.classList.add('modal-open')
    return () => document.documentElement.classList.remove('modal-open')
  }, [])

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" aria-hidden="true" />
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose} aria-label="關閉">
            <IconClose />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

// ─── Product Form ─────────────────────────────────────────────────────────────

function ProductForm({
  initial,
  onSave,
  onClose,
}: {
  initial?: Product
  onSave: (p: Product) => void
  onClose: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [currency, setCurrency] = useState<Currency>(initial?.currency ?? 'KRW')
  const [price, setPrice] = useState(initial?.price !== undefined ? String(initial.price) : '')
  const [quantity, setQuantity] = useState(initial?.quantity !== undefined ? String(initial.quantity) : '1')
  const [exchangeRate, setExchangeRate] = useState(
    initial?.exchangeRate !== undefined && initial.currency !== 'TWD' ? String(initial.exchangeRate) : ''
  )
  const [weight, setWeight] = useState(initial?.weight !== undefined ? String(initial.weight) : '1')
  const [showWeightHint, setShowWeightHint] = useState(false)
  const [error, setError] = useState('')

  function handleCurrencyChange(c: Currency) {
    setCurrency(c)
    if (c === 'TWD') setExchangeRate('')
    setError('')
  }

  function handleSave() {
    setError('')
    if (!name.trim()) return setError('請輸入商品名稱')
    const p = parseFloat(price)
    const q = parseFloat(quantity)
    const er = currency === 'TWD' ? 1 : parseFloat(exchangeRate)
    const w = parseFloat(weight)
    if (isNaN(p) || p <= 0) return setError('請輸入有效的單價（大於 0）')
    if (isNaN(q) || q <= 0) return setError('請輸入有效的數量（大於 0）')
    if (currency !== 'TWD' && (isNaN(er) || er <= 0)) return setError('請輸入有效的匯率（大於 0）')
    if (isNaN(w) || w <= 0) return setError('請輸入有效的權重（大於 0）')

    onSave({
      id: initial?.id ?? genId(),
      name: name.trim(),
      currency,
      price: p,
      quantity: q,
      exchangeRate: currency === 'TWD' ? 1 : er,
      weight: w,
    })
    onClose()
  }

  return (
    <form className="form" onSubmit={(e) => { e.preventDefault(); handleSave() }}>
      <div className="form-group">
        <label className="form-label" htmlFor="p-name">商品名稱</label>
        <input
          id="p-name"
          className="form-input"
          placeholder="例：韓國面膜、Nike 球鞋"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="p-currency">幣別</label>
          <select
            id="p-currency"
            className="form-input"
            value={currency}
            onChange={(e) => handleCurrencyChange(e.target.value as Currency)}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{CURRENCY_LABELS[c]}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="p-price">單價</label>
          <input
            id="p-price"
            className="form-input"
            type="number"
            min="0"
            step="any"
            placeholder="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="p-qty">數量</label>
          <input
            id="p-qty"
            className="form-input"
            type="number"
            min="1"
            step="any"
            placeholder="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            inputMode="decimal"
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="p-rate">
            匯率
            {currency === 'TWD' && <span className="form-hint">（固定 1）</span>}
          </label>
          <input
            id="p-rate"
            className="form-input"
            type="number"
            min="0"
            step="any"
            placeholder={currency === 'KRW' ? '例：0.023' : '例：32.5'}
            value={currency === 'TWD' ? '1' : exchangeRate}
            onChange={(e) => setExchangeRate(e.target.value)}
            disabled={currency === 'TWD'}
            inputMode="decimal"
          />
        </div>
      </div>

      <div className="form-group">
        <div className="form-label-row">
          <label className="form-label" htmlFor="p-weight">權重</label>
          <button
            type="button"
            className="hint-toggle"
            onClick={() => setShowWeightHint((v) => !v)}
            aria-expanded={showWeightHint}
          >
            {showWeightHint ? '收起' : '怎麼設？'}
          </button>
        </div>
        <input
          id="p-weight"
          className="form-input"
          type="number"
          min="0"
          step="any"
          placeholder="1"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          inputMode="decimal"
        />
        {/* 快速選擇 */}
        <div className="weight-chips">
          {[
            { label: '一般', value: '1' },
            { label: '要跑一趟', value: '3' },
            { label: '要排隊', value: '5' },
            { label: '限定搶購', value: '10' },
          ].map((chip) => (
            <button
              key={chip.value}
              type="button"
              className={`weight-chip${weight === chip.value ? ' active' : ''}`}
              onClick={() => setWeight(chip.value)}
            >
              {chip.label} <span>{chip.value}</span>
            </button>
          ))}
        </div>
        {/* 展開說明 */}
        {showWeightHint && (
          <div className="weight-hint-box">
            <p className="weight-hint-title">權重影響其他花費（機票、住宿等）的分攤比例</p>
            <div className="weight-hint-rows">
              <div className="weight-hint-row">
                <span className="weight-hint-badge">×1</span>
                <span>一般商品，隨手就買到</span>
              </div>
              <div className="weight-hint-row">
                <span className="weight-hint-badge">×2–3</span>
                <span>需要特別跑一趟才買得到</span>
              </div>
              <div className="weight-hint-row">
                <span className="weight-hint-badge">×4–5</span>
                <span>現場排隊 1–2 小時</span>
              </div>
              <div className="weight-hint-row">
                <span className="weight-hint-badge">×8–10</span>
                <span>限定款、搶購、跑多間店</span>
              </div>
            </div>
            <p className="weight-hint-note">也可以直接用數量當權重，讓買越多件的商品承擔越多成本。</p>
          </div>
        )}
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      <button type="submit" className="btn-primary">
        {initial ? '儲存變更' : '新增商品'}
      </button>
    </form>
  )
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({
  product: p,
  onEdit,
  onDelete,
}: {
  product: Product
  onEdit: () => void
  onDelete: () => void
}) {
  const cost = productTWD(p)
  return (
    <div className="card">
      <div className="card-main">
        <div className="card-info">
          <span className="card-name">{p.name}</span>
          <span className="card-meta">
            {p.currency} {p.price.toLocaleString()} × {p.quantity} 件
            {p.currency !== 'TWD' && ` @ ${p.exchangeRate}`}
          </span>
          <span className="card-meta">權重：{p.weight}</span>
        </div>
        <div className="card-cost">
          <span className="cost-label">原始成本</span>
          <span className="cost-value">NT$ {fmt(cost)}</span>
        </div>
      </div>
      <div className="card-actions">
        <button className="btn-action" onClick={onEdit} aria-label={`編輯 ${p.name}`}>
          <IconEdit /> 編輯
        </button>
        <button className="btn-action danger" onClick={onDelete} aria-label={`刪除 ${p.name}`}>
          <IconTrash /> 刪除
        </button>
      </div>
    </div>
  )
}

// ─── Buy Page ─────────────────────────────────────────────────────────────────

function BuyPage({
  products,
  setProducts,
}: {
  products: Product[]
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>
}) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Product | undefined>()

  function openAdd() { setEditing(undefined); setShowForm(true) }
  function openEdit(p: Product) { setEditing(p); setShowForm(true) }
  function closeForm() { setShowForm(false); setEditing(undefined) }

  function handleSave(p: Product) {
    setProducts((prev) => {
      const idx = prev.findIndex((x) => x.id === p.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = p
        return next
      }
      return [...prev, p]
    })
  }

  function handleDelete(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  const totalCost = products.reduce((s, p) => s + productTWD(p), 0)

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">買貨清單</h1>
        <button className="btn-icon" onClick={openAdd} aria-label="新增商品">
          <IconPlus />
        </button>
      </header>

      {products.length === 0 ? (
        <div className="empty-state">
          <svg className="empty-icon" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M42 28V20a10 10 0 00-20 0v8M13 26h38l3 30H10L13 26z" />
          </svg>
          <p>尚未新增任何商品<br />開始記錄本次進貨吧</p>
          <button className="btn-primary" onClick={openAdd}>新增第一個商品</button>
        </div>
      ) : (
        <>
          <div className="summary-banner">
            <span className="summary-label">商品原始總成本</span>
            <span className="summary-value">NT$ {fmt(totalCost)}</span>
          </div>
          <div className="card-list">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onEdit={() => openEdit(p)}
                onDelete={() => handleDelete(p.id)}
              />
            ))}
          </div>
          <button className="fab" onClick={openAdd} aria-label="新增商品">
            <IconPlus />
          </button>
        </>
      )}

      {showForm && (
        <Modal title={editing ? '編輯商品' : '新增商品'} onClose={closeForm}>
          <ProductForm initial={editing} onSave={handleSave} onClose={closeForm} />
        </Modal>
      )}
    </div>
  )
}

// ─── Expense Form ─────────────────────────────────────────────────────────────

function ExpenseForm({
  initial,
  onSave,
  onClose,
}: {
  initial?: Expense
  onSave: (e: Expense) => void
  onClose: () => void
}) {
  const [category, setCategory] = useState(initial?.category ?? '排隊薪水')
  const [currency, setCurrency] = useState<Currency>(initial?.currency ?? 'TWD')
  const [amount, setAmount] = useState(initial?.amount !== undefined ? String(initial.amount) : '')
  const [exchangeRate, setExchangeRate] = useState(
    initial?.exchangeRate !== undefined && initial.currency !== 'TWD' ? String(initial.exchangeRate) : ''
  )
  const [note, setNote] = useState(initial?.note ?? '')
  const [error, setError] = useState('')

  function handleCurrencyChange(c: Currency) {
    setCurrency(c)
    if (c === 'TWD') setExchangeRate('')
    setError('')
  }

  function handleSave() {
    setError('')
    const a = parseFloat(amount)
    const er = currency === 'TWD' ? 1 : parseFloat(exchangeRate)
    if (isNaN(a) || a <= 0) return setError('請輸入有效的金額（大於 0）')
    if (currency !== 'TWD' && (isNaN(er) || er <= 0)) return setError('請輸入有效的匯率（大於 0）')

    onSave({
      id: initial?.id ?? genId(),
      category,
      amount: a,
      currency,
      exchangeRate: currency === 'TWD' ? 1 : er,
      note: note.trim(),
    })
    onClose()
  }

  return (
    <form className="form" onSubmit={(e) => { e.preventDefault(); handleSave() }}>
      <div className="form-group">
        <label className="form-label" htmlFor="e-category">花費類別</label>
        <select
          id="e-category"
          className="form-input"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="e-currency">幣別</label>
          <select
            id="e-currency"
            className="form-input"
            value={currency}
            onChange={(e) => handleCurrencyChange(e.target.value as Currency)}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{CURRENCY_LABELS[c]}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="e-amount">金額</label>
          <input
            id="e-amount"
            className="form-input"
            type="number"
            min="0"
            step="any"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
          />
        </div>
      </div>

      {currency !== 'TWD' && (
        <div className="form-group">
          <label className="form-label" htmlFor="e-rate">
            匯率（1 {currency} = ? 台幣）
          </label>
          <input
            id="e-rate"
            className="form-input"
            type="number"
            min="0"
            step="any"
            placeholder={currency === 'KRW' ? '例：0.023' : '例：32.5'}
            value={exchangeRate}
            onChange={(e) => setExchangeRate(e.target.value)}
            inputMode="decimal"
          />
        </div>
      )}

      <div className="form-group">
        <label className="form-label" htmlFor="e-note">備註（選填）</label>
        <input
          id="e-note"
          className="form-input"
          placeholder="補充說明..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      <button type="submit" className="btn-primary">
        {initial ? '儲存變更' : '新增花費'}
      </button>
    </form>
  )
}

// ─── Expense Card ─────────────────────────────────────────────────────────────

function ExpenseCard({
  expense: e,
  onEdit,
  onDelete,
}: {
  expense: Expense
  onEdit: () => void
  onDelete: () => void
}) {
  const twdAmount = expenseTWD(e)
  return (
    <div className="card">
      <div className="card-main">
        <div className="card-info">
          <span className="card-name">{e.category}</span>
          <span className="card-meta">
            {e.currency} {e.amount.toLocaleString()}
            {e.currency !== 'TWD' && ` @ ${e.exchangeRate}`}
          </span>
          {e.note && <span className="card-note">{e.note}</span>}
        </div>
        <div className="card-cost">
          <span className="cost-label">台幣金額</span>
          <span className="cost-value">NT$ {fmt(twdAmount)}</span>
        </div>
      </div>
      <div className="card-actions">
        <button className="btn-action" onClick={onEdit} aria-label={`編輯 ${e.category}`}>
          <IconEdit /> 編輯
        </button>
        <button className="btn-action danger" onClick={onDelete} aria-label={`刪除 ${e.category}`}>
          <IconTrash /> 刪除
        </button>
      </div>
    </div>
  )
}

// ─── Expense Page ─────────────────────────────────────────────────────────────

function ExpensePage({
  expenses,
  setExpenses,
}: {
  expenses: Expense[]
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>
}) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Expense | undefined>()

  function openAdd() { setEditing(undefined); setShowForm(true) }
  function openEdit(e: Expense) { setEditing(e); setShowForm(true) }
  function closeForm() { setShowForm(false); setEditing(undefined) }

  function handleSave(e: Expense) {
    setExpenses((prev) => {
      const idx = prev.findIndex((x) => x.id === e.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = e
        return next
      }
      return [...prev, e]
    })
  }

  function handleDelete(id: string) {
    setExpenses((prev) => prev.filter((e) => e.id !== id))
  }

  const total = expenses.reduce((s, e) => s + expenseTWD(e), 0)

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">其他花費</h1>
        <button className="btn-icon" onClick={openAdd} aria-label="新增花費">
          <IconPlus />
        </button>
      </header>

      {expenses.length === 0 ? (
        <div className="empty-state">
          <svg className="empty-icon" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="8" y="14" width="48" height="36" rx="4" />
            <path d="M8 26h48M20 14v12M44 14v12" />
          </svg>
          <p>尚未記錄任何額外花費<br />機票、住宿、交通都算進來吧</p>
          <button className="btn-primary" onClick={openAdd}>新增第一筆花費</button>
        </div>
      ) : (
        <>
          <div className="summary-banner">
            <span className="summary-label">其他花費總額</span>
            <span className="summary-value">NT$ {fmt(total)}</span>
          </div>
          <div className="card-list">
            {expenses.map((e) => (
              <ExpenseCard
                key={e.id}
                expense={e}
                onEdit={() => openEdit(e)}
                onDelete={() => handleDelete(e.id)}
              />
            ))}
          </div>
          <button className="fab" onClick={openAdd} aria-label="新增花費">
            <IconPlus />
          </button>
        </>
      )}

      {showForm && (
        <Modal title={editing ? '編輯花費' : '新增花費'} onClose={closeForm}>
          <ExpenseForm initial={editing} onSave={handleSave} onClose={closeForm} />
        </Modal>
      )}
    </div>
  )
}

// ─── Report Page ──────────────────────────────────────────────────────────────

function ReportPage({
  products,
  totalExpenseTWD,
  totalProductCostTWD,
  getAllocated,
  getUnitCost,
}: {
  products: Product[]
  totalExpenseTWD: number
  totalProductCostTWD: number
  getAllocated: (p: Product) => number
  getUnitCost: (p: Product) => number
}) {
  const totalCost = totalProductCostTWD + totalExpenseTWD

  if (products.length === 0) {
    return (
      <div className="page">
        <header className="page-header">
          <h1 className="page-title">成本報表</h1>
        </header>
        <div className="empty-state">
          <svg className="empty-icon" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="8" y="8" width="48" height="48" rx="4" />
            <path d="M16 24h20M16 32h28M16 40h14" />
          </svg>
          <p>請先在「買貨」頁新增商品<br />才能產生成本報表</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1 className="page-title">成本報表</h1>
      </header>

      {/* 整體成本摘要 */}
      <div className="report-summary" role="region" aria-label="整體成本摘要">
        <div className="summary-row">
          <span className="summary-row-label">商品原始總成本</span>
          <span className="summary-row-value">NT$ {fmt(totalProductCostTWD)}</span>
        </div>
        <div className="summary-row">
          <span className="summary-row-label">其他花費總額</span>
          <span className="summary-row-value">NT$ {fmt(totalExpenseTWD)}</span>
        </div>
        <div className="summary-row total">
          <span className="summary-row-label">整體總成本</span>
          <span className="summary-row-value">NT$ {fmt(totalCost)}</span>
        </div>
      </div>

      {/* 商品分攤明細 */}
      <p className="section-title">商品分攤明細</p>
      <div className="card-list">
        {products.map((p) => {
          const origCost = productTWD(p)
          const allocated = getAllocated(p)
          const finalCost = origCost + allocated
          const unitCost = getUnitCost(p)

          return (
            <div key={p.id} className="report-card">
              <div className="report-card-header">
                <span className="card-name">{p.name}</span>
                <span className="report-unit-cost">NT$ {fmt(unitCost)} / 件</span>
              </div>
              <div className="report-rows">
                <div className="report-row">
                  <span>原始成本</span>
                  <span>NT$ {fmt(origCost)}</span>
                </div>
                <div className="report-row">
                  <span>商品數量</span>
                  <span>{p.quantity} 件</span>
                </div>
                <div className="report-row">
                  <span>權重</span>
                  <span>{p.weight}</span>
                </div>
                <div className="report-row">
                  <span>分攤其他花費</span>
                  <span className="accent">+NT$ {fmt(allocated)}</span>
                </div>
                <div className="report-row bold">
                  <span>最終總成本</span>
                  <span>NT$ {fmt(finalCost)}</span>
                </div>
                <div className="report-row highlight">
                  <span>最終單件成本</span>
                  <span>NT$ {fmt(unitCost)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState<Page>('buy')
  const [products, setProducts] = useState<Product[]>(() => {
    try { return JSON.parse(localStorage.getItem('dg_products') || '[]') } catch { return [] }
  })
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try { return JSON.parse(localStorage.getItem('dg_expenses') || '[]') } catch { return [] }
  })

  useEffect(() => {
    localStorage.setItem('dg_products', JSON.stringify(products))
  }, [products])

  useEffect(() => {
    localStorage.setItem('dg_expenses', JSON.stringify(expenses))
  }, [expenses])

  // Report calculations
  const totalExpenseTWD = expenses.reduce((s, e) => s + expenseTWD(e), 0)
  const totalProductCostTWD = products.reduce((s, p) => s + productTWD(p), 0)
  const totalWeight = products.reduce((s, p) => s + p.weight, 0)

  const getAllocated = (p: Product) =>
    totalWeight > 0 ? totalExpenseTWD * (p.weight / totalWeight) : 0

  const getUnitCost = (p: Product) =>
    p.quantity > 0 ? (productTWD(p) + getAllocated(p)) / p.quantity : 0

  return (
    <div className="app">
<div className="page-container">
        {page === 'buy' && (
          <BuyPage products={products} setProducts={setProducts} />
        )}
        {page === 'expense' && (
          <ExpensePage expenses={expenses} setExpenses={setExpenses} />
        )}
        {page === 'report' && (
          <ReportPage
            products={products}
            totalExpenseTWD={totalExpenseTWD}
            totalProductCostTWD={totalProductCostTWD}
            getAllocated={getAllocated}
            getUnitCost={getUnitCost}
          />
        )}
      </div>
      <BottomNav
        page={page}
        setPage={setPage}
        productCount={products.length}
        expenseCount={expenses.length}
      />
    </div>
  )
}

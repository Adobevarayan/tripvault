import { useEffect, useState, type FormEvent } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { CalendarDays, Compass, LogOut, MapPin, Plus, Wallet } from 'lucide-react'
import { supabase, isSupabaseReady } from './lib/supabase'

type TripRow = {
  id: string
  owner_id: string
  name: string
  description: string | null
  start_location: string | null
  travel_mode: string | null
  start_date: string | null
  end_date: string | null
  travellers: number | null
  budget: number | null
  currency: string | null
  cover_image: string | null
  visibility: string | null
  completed: boolean
  completion_date: string | null
  created_at: string
}

type ExpenseRow = {
  id: string
  trip_id: string
  title: string
  amount: number
  currency: string
  expense_date: string
  category: string
}

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100'
const cardClass = 'rounded-3xl border border-slate-200 bg-white p-5 shadow-sm'

export default function SupabaseApp() {
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [trips, setTrips] = useState<TripRow[]>([])
  const [expenses, setExpenses] = useState<ExpenseRow[]>([])
  const [selectedTripId, setSelectedTripId] = useState('')
  const [pageLoading, setPageLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'reset'>('signin')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [tripForm, setTripForm] = useState({ name: '', description: '', start_location: '', start_date: '', end_date: '', travellers: '1', budget: '0', currency: 'INR', travel_mode: 'Car' })
  const [expenseForm, setExpenseForm] = useState({ title: '', amount: '', category: 'Food', expense_date: new Date().toISOString().slice(0, 10) })

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError) setError(sessionError.message)
      setSession(data.session)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setError('')
      setNotice('')
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user) {
      setTrips([])
      setExpenses([])
      setSelectedTripId('')
      return
    }
    void loadTrips(session.user)
  }, [session?.user?.id])

  async function loadTrips(user: User) {
    if (!supabase) return
    setPageLoading(true)
    setError('')
    const { data, error: queryError } = await supabase
      .from('trips')
      .select('id,owner_id,name,description,start_location,travel_mode,start_date,end_date,travellers,budget,currency,cover_image,visibility,completed,completion_date,created_at')
      .order('start_date', { ascending: true, nullsFirst: false })
    if (queryError) {
      setError(`Could not load trips: ${queryError.message}. Check that the TripVault SQL schema has been applied in Supabase.`)
      setPageLoading(false)
      return
    }
    const rows = (data ?? []) as TripRow[]
    setTrips(rows)
    setSelectedTripId((current) => rows.some((trip) => trip.id === current) ? current : rows[0]?.id ?? '')
    const { data: expenseRows, error: expenseError } = await supabase
      .from('expenses')
      .select('id,trip_id,title,amount,currency,expense_date,category')
      .order('expense_date', { ascending: false })
    if (expenseError) setError(`Trips loaded, but expenses could not be loaded: ${expenseError.message}`)
    else setExpenses((expenseRows ?? []) as ExpenseRow[])
    setPageLoading(false)
  }

  async function submitAuth(event: FormEvent) {
    event.preventDefault()
    if (!supabase) return
    setError('')
    setNotice('')
    setPageLoading(true)
    if (authMode === 'signup') {
      const { data, error: authError } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
        options: { data: { full_name: fullName.trim() } }
      })
      if (authError) setError(authError.message)
      else if (!data.session) setNotice('Account created. Check your email to confirm your address, then sign in.')
      else setNotice('Account created successfully.')
    } else if (authMode === 'reset') {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(authEmail, { redirectTo: window.location.origin })
      if (authError) setError(authError.message)
      else setNotice('If an account exists for that email, a password-reset link has been sent.')
    } else {
      const { error: authError } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword })
      if (authError) setError(authError.message)
    }
    setPageLoading(false)
  }

  async function createTrip(event: FormEvent) {
    event.preventDefault()
    if (!supabase || !session?.user) return
    setError('')
    setNotice('')
    setPageLoading(true)
    const { data, error: insertError } = await supabase.from('trips').insert({
      owner_id: session.user.id,
      name: tripForm.name.trim(),
      description: tripForm.description.trim(),
      start_location: tripForm.start_location.trim(),
      start_date: tripForm.start_date || null,
      end_date: tripForm.end_date || null,
      travellers: Number(tripForm.travellers),
      budget: Number(tripForm.budget),
      currency: tripForm.currency,
      travel_mode: tripForm.travel_mode,
      visibility: 'Private'
    }).select('id,owner_id,name,description,start_location,travel_mode,start_date,end_date,travellers,budget,currency,cover_image,visibility,completed,completion_date,created_at').single()
    if (insertError) setError(`Trip could not be saved: ${insertError.message}`)
    else if (data) {
      setTrips((current) => [data as TripRow, ...current])
      setSelectedTripId(data.id)
      setTripForm({ name: '', description: '', start_location: '', start_date: '', end_date: '', travellers: '1', budget: '0', currency: 'INR', travel_mode: 'Car' })
      setNotice('Trip saved to your Supabase database.')
    }
    setPageLoading(false)
  }

  async function addExpense(event: FormEvent) {
    event.preventDefault()
    if (!supabase || !selectedTripId || !session?.user) return
    setError('')
    setPageLoading(true)
    const { data, error: insertError } = await supabase.from('expenses').insert({
      trip_id: selectedTripId,
      title: expenseForm.title.trim(),
      amount: Number(expenseForm.amount),
      category: expenseForm.category,
      expense_date: expenseForm.expense_date,
      currency: selectedTrip?.currency || 'INR',
      created_by: session.user.id
    }).select('id,trip_id,title,amount,currency,expense_date,category').single()
    if (insertError) setError(`Expense could not be saved: ${insertError.message}`)
    else if (data) {
      setExpenses((current) => [data as ExpenseRow, ...current])
      setExpenseForm({ title: '', amount: '', category: 'Food', expense_date: new Date().toISOString().slice(0, 10) })
      setNotice('Expense saved.')
    }
    setPageLoading(false)
  }

  async function toggleCompleted(trip: TripRow) {
    if (!supabase) return
    setError('')
    const completed = !trip.completed
    const { data, error: updateError } = await supabase.from('trips').update({ completed, completion_date: completed ? new Date().toISOString().slice(0, 10) : null }).eq('id', trip.id).select('id,owner_id,name,description,start_location,travel_mode,start_date,end_date,travellers,budget,currency,cover_image,visibility,completed,completion_date,created_at').single()
    if (updateError) setError(`Trip status could not be updated: ${updateError.message}`)
    else if (data) setTrips((current) => current.map((item) => item.id === trip.id ? data as TripRow : item))
  }

  const selectedTrip = trips.find((trip) => trip.id === selectedTripId)
  const tripExpenses = expenses.filter((item) => item.trip_id === selectedTripId)
  const totalSpent = tripExpenses.reduce((sum, item) => sum + Number(item.amount), 0)

  if (!isSupabaseReady || !supabase) return <SetupNotice />
  if (authLoading) return <LoadingScreen />
  if (!session) return (
    <main className="min-h-screen bg-[#f7f4ec] px-4 py-10 text-[#101b2d]">
      <section className="mx-auto grid min-h-[620px] max-w-5xl overflow-hidden rounded-[32px] bg-white shadow-2xl md:grid-cols-2">
        <div className="flex flex-col justify-between bg-[#101b2d] p-8 text-white md:p-12">
          <Brand />
          <div><p className="text-xs uppercase tracking-[.25em] text-[#e99a52]">Your journey, in one place</p><h1 className="mt-4 font-serif text-4xl">Plan. Explore. Capture. Relive.</h1><p className="mt-4 text-sm leading-6 text-white/70">Sign in to manage trips and expenses saved securely to your own account.</p></div>
          <p className="text-xs text-white/50">TripVault • Private by default</p>
        </div>
        <div className="flex items-center p-7 md:p-12">
          <form onSubmit={submitAuth} className="w-full space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#e99a52]">{authMode === 'signup' ? 'Create account' : authMode === 'reset' ? 'Account recovery' : 'Welcome back'}</p>
            <h2 className="text-3xl font-bold">{authMode === 'signup' ? 'Join TripVault' : authMode === 'reset' ? 'Reset password' : 'Sign in'}</h2>
            {authMode === 'signup' && <label className="block text-sm">Full name<input required value={fullName} onChange={(e) => setFullName(e.target.value)} className={`${inputClass} mt-1`} autoComplete="name" /></label>}
            <label className="block text-sm">Email<input required type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className={`${inputClass} mt-1`} autoComplete="email" /></label>
            {authMode !== 'reset' && <label className="block text-sm">Password<input required minLength={8} type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className={`${inputClass} mt-1`} autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} /></label>}
            {error && <ErrorBanner>{error}</ErrorBanner>}{notice && <Notice>{notice}</Notice>}
            <button disabled={pageLoading} className="w-full rounded-xl bg-[#183d35] px-4 py-3 font-semibold text-white disabled:opacity-60">{pageLoading ? 'Please wait…' : authMode === 'signup' ? 'Create account' : authMode === 'reset' ? 'Send reset link' : 'Sign in'}</button>
            <div className="flex flex-wrap justify-between gap-2 text-sm">
              {authMode !== 'signin' && <button type="button" className="text-[#183d35] underline" onClick={() => { setAuthMode('signin'); setError(''); setNotice('') }}>Back to sign in</button>}
              {authMode === 'signin' && <><button type="button" className="text-[#183d35] underline" onClick={() => setAuthMode('signup')}>Create account</button><button type="button" className="text-slate-500 underline" onClick={() => setAuthMode('reset')}>Forgot password?</button></>}
            </div>
          </form>
        </div>
      </section>
    </main>
  )

  return (
    <main className="min-h-screen bg-[#f7f4ec] text-[#101b2d]">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8"><Brand /><div className="flex items-center gap-3"><span className="hidden max-w-[220px] truncate text-sm text-slate-600 sm:block">{session.user.email}</span><button onClick={() => void supabase.auth.signOut()} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm"><LogOut size={16}/>Sign out</button></div></div>
      </header>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-8">
        <section className="flex flex-col justify-between gap-4 rounded-3xl bg-[#101b2d] p-6 text-white md:flex-row md:items-center md:p-8"><div><p className="text-xs uppercase tracking-[.2em] text-[#e99a52]">Trip dashboard</p><h1 className="mt-2 text-3xl font-bold">Your journeys</h1><p className="mt-2 text-white/70">Your trips and expenses are stored in Supabase and protected by row-level security.</p></div><div className="rounded-2xl bg-white/10 p-4"><p className="text-sm text-white/70">Trips</p><p className="text-3xl font-bold">{trips.length}</p></div></section>
        {error && <ErrorBanner>{error}</ErrorBanner>}{notice && <Notice>{notice}</Notice>}
        <div className="grid items-start gap-6 lg:grid-cols-[.9fr_1.1fr]">
          <form onSubmit={createTrip} className={`${cardClass} space-y-4`}>
            <div className="flex items-center gap-2"><Plus className="text-[#e99a52]"/><h2 className="text-xl font-bold">Create a trip</h2></div>
            <label className="block text-sm">Trip name<input required maxLength={100} value={tripForm.name} onChange={(e) => setTripForm({ ...tripForm, name: e.target.value })} className={`${inputClass} mt-1`} placeholder="A weekend in Goa" /></label>
            <label className="block text-sm">Description<textarea value={tripForm.description} onChange={(e) => setTripForm({ ...tripForm, description: e.target.value })} className={`${inputClass} mt-1`} rows={2} /></label>
            <label className="block text-sm">Starting location<input value={tripForm.start_location} onChange={(e) => setTripForm({ ...tripForm, start_location: e.target.value })} className={`${inputClass} mt-1`} /></label>
            <div className="grid grid-cols-2 gap-3"><label className="block text-sm">Start date<input type="date" value={tripForm.start_date} onChange={(e) => setTripForm({ ...tripForm, start_date: e.target.value })} className={`${inputClass} mt-1`} /></label><label className="block text-sm">End date<input type="date" value={tripForm.end_date} min={tripForm.start_date || undefined} onChange={(e) => setTripForm({ ...tripForm, end_date: e.target.value })} className={`${inputClass} mt-1`} /></label></div>
            <div className="grid grid-cols-2 gap-3"><label className="block text-sm">Travel mode<select value={tripForm.travel_mode} onChange={(e) => setTripForm({ ...tripForm, travel_mode: e.target.value })} className={`${inputClass} mt-1`}>{['Car','Bike','Bus','Train','Flight','Walking'].map((mode) => <option key={mode}>{mode}</option>)}</select></label><label className="block text-sm">Travellers<input required min="1" type="number" value={tripForm.travellers} onChange={(e) => setTripForm({ ...tripForm, travellers: e.target.value })} className={`${inputClass} mt-1`} /></label></div>
            <div className="grid grid-cols-2 gap-3"><label className="block text-sm">Budget<input min="0" type="number" value={tripForm.budget} onChange={(e) => setTripForm({ ...tripForm, budget: e.target.value })} className={`${inputClass} mt-1`} /></label><label className="block text-sm">Currency<select value={tripForm.currency} onChange={(e) => setTripForm({ ...tripForm, currency: e.target.value })} className={`${inputClass} mt-1`}>{['INR','USD','EUR','GBP','AED'].map((currency) => <option key={currency}>{currency}</option>)}</select></label></div>
            <button disabled={pageLoading} className="w-full rounded-xl bg-[#183d35] px-4 py-3 font-semibold text-white disabled:opacity-60">{pageLoading ? 'Saving…' : 'Save trip'}</button>
          </form>
          <section className={`${cardClass} min-h-64`}>
            <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">Your trips</h2>{pageLoading && <span className="text-sm text-slate-500">Loading…</span>}</div>
            {trips.length === 0 ? <p className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">No trips yet. Add your first trip using the form.</p> : <div className="space-y-3">{trips.map((trip) => <article key={trip.id} className={`rounded-2xl border p-4 ${selectedTripId === trip.id ? 'border-[#183d35] bg-[#f5f8f5]' : 'border-slate-200'}`}><div className="flex flex-wrap items-start justify-between gap-3"><button onClick={() => setSelectedTripId(trip.id)} className="text-left"><h3 className="font-bold">{trip.name}</h3><p className="mt-1 text-sm text-slate-600">{trip.description || 'No description'}</p></button><button onClick={() => void toggleCompleted(trip)} className={`rounded-full px-3 py-1 text-xs font-medium ${trip.completed ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>{trip.completed ? 'Completed · reopen' : 'In progress · finish'}</button></div><div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500"><span className="inline-flex items-center gap-1"><CalendarDays size={14}/>{trip.start_date || 'Dates not set'}{trip.end_date ? ` – ${trip.end_date}` : ''}</span><span className="inline-flex items-center gap-1"><MapPin size={14}/>{trip.start_location || 'Starting location not set'}</span><span>{trip.travel_mode || 'Travel mode not set'}</span></div></article>)}</div>}
            {selectedTrip && <div className="mt-6 border-t border-slate-200 pt-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-bold">Expenses · {selectedTrip.name}</h3><p className="text-sm text-slate-500">Spent {new Intl.NumberFormat(undefined, { style: 'currency', currency: selectedTrip.currency || 'INR' }).format(totalSpent)} / {new Intl.NumberFormat(undefined, { style: 'currency', currency: selectedTrip.currency || 'INR' }).format(Number(selectedTrip.budget || 0))}</p></div><Wallet className="text-[#e99a52]"/></div><form onSubmit={addExpense} className="grid gap-3 sm:grid-cols-2"><input required value={expenseForm.title} onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })} className={inputClass} placeholder="Expense description"/><input required min="0.01" step="0.01" type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} className={inputClass} placeholder="Amount"/><select value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })} className={inputClass}>{['Transport','Accommodation','Food','Tickets','Shopping','Fuel','Other'].map((category) => <option key={category}>{category}</option>)}</select><input type="date" value={expenseForm.expense_date} onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })} className={inputClass}/><button disabled={pageLoading} className="rounded-xl bg-[#183d35] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 sm:col-span-2">Add expense</button></form><div className="mt-4 space-y-2">{tripExpenses.map((expense) => <div key={expense.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"><span>{expense.title} <span className="text-slate-500">· {expense.category} · {expense.expense_date}</span></span><strong>{new Intl.NumberFormat(undefined, { style: 'currency', currency: expense.currency || 'INR' }).format(Number(expense.amount))}</strong></div>)}</div></div>}
          </section>
        </div>
      </div>
    </main>
  )
}

function Brand() {
  return <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#e99a52] to-[#dcccb5] text-[#101b2d]"><Compass size={21}/></span><span><strong className="block text-lg">TripVault</strong><small className="text-xs opacity-70">Plan. Explore. Capture. Relive.</small></span></div>
}
function ErrorBanner({ children }: { children: string }) { return <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{children}</p> }
function Notice({ children }: { children: string }) { return <p role="status" className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{children}</p> }
function LoadingScreen() { return <div className="grid min-h-screen place-items-center bg-[#f7f4ec] text-[#101b2d]">Loading TripVault…</div> }
function SetupNotice() {
  return <main className="grid min-h-screen place-items-center bg-[#f7f4ec] p-5 text-[#101b2d]"><section className="max-w-xl rounded-3xl bg-white p-8 shadow-xl"><Brand/><h1 className="mt-8 text-2xl font-bold">Connect your Supabase project</h1><p className="mt-3 text-sm leading-6 text-slate-600">Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in your Vercel project environment variables, then redeploy. Locally, put them in <code>.env</code>. Use the Supabase publishable key only—never a service-role key in the browser.</p></section></main>
}

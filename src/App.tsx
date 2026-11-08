import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  CalendarClock,
  Camera,
  CheckCircle2,
  ChevronRight,
  Compass,
  Download,
  LayoutDashboard,
  MapPinned,
  Menu,
  MessageSquareText,
  Plus,
  Route,
  ShieldCheck,
  Sparkles,
  Star,
  UploadCloud,
  UserCircle2,
  Wallet,
  X,
  Search,
  Bell,
  Plane,
  Map,
  ImageIcon,
  FileText,
  Users,
  Clock3,
  Briefcase,
  MoonStar,
  SunMedium,
  LogOut,
  Check,
  Trash2,
  Pencil,
  MoreHorizontal,
  CreditCard,
  LocateFixed,
  Share2
} from 'lucide-react'
import { motion } from 'framer-motion'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import { format } from 'date-fns'
import { Route as RouterRoute, Navigate, Routes, Link, useNavigate, useParams } from 'react-router-dom'
import { sampleTrip } from './data/sampleData'
import type { Destination, Expense, Memory, Trip, TripStatus } from './types'
import { cn, formatCurrency } from './lib/utils'
import { isSupabaseReady } from './lib/supabase'

const appName = 'TripVault'

const initialUser = {
  name: 'Aditi Sharma',
  email: 'aditi@tripvault.io',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80'
}

const themeOptions = ['Light', 'Dark'] as const

type ActivityTab = 'overview' | 'itinerary' | 'destinations' | 'map' | 'memories' | 'media' | 'expenses' | 'documents' | 'report'

type View = 'landing' | 'auth' | 'dashboard' | 'trip' | 'archive' | 'profile'

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const defaultTrip = sampleTrip

function App() {
  const [darkMode, setDarkMode] = useState(false)
  const [loggedIn, setLoggedIn] = useState(true)
  const [currentView, setCurrentView] = useState<View>('dashboard')
  const [selectedTrip, setSelectedTrip] = useState<Trip>(defaultTrip)
  const [trips, setTrips] = useState<Trip[]>([defaultTrip])
  const [tripTab, setTripTab] = useState<ActivityTab>('overview')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [newExpense, setNewExpense] = useState({
    title: '',
    amount: '',
    currency: 'INR',
    date: new Date().toISOString().slice(0, 10),
    category: 'Transport',
    paymentMethod: 'UPI',
    destination: 'Baga',
    payer: 'Aditi',
    notes: ''
  })

  useEffect(() => {
    const saved = localStorage.getItem('tripvault-state')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.trips?.length) {
        setTrips(parsed.trips)
        setSelectedTrip(parsed.trips[0])
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('tripvault-state', JSON.stringify({ trips, selectedTrip }))
  }, [trips, selectedTrip])

  const filteredTrips = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return trips
    return trips.filter((trip) =>
      [trip.name, trip.description, trip.startLocation, trip.destinations.join(' ')].join(' ').toLowerCase().includes(q)
    )
  }, [trips, search])

  const totalBudget = trips.reduce((sum, trip) => sum + trip.budget, 0)
  const upcomingTrips = trips.filter((trip) => !trip.completed).length
  const completedTrips = trips.filter((trip) => trip.completed).length
  const totalVisited = trips.reduce((sum, trip) => sum + trip.stats.visitedPlaces, 0)
  const totalExpenses = trips.reduce((sum, trip) => sum + trip.expenses.reduce((acc, item) => acc + item.amount, 0), 0)

  const createTrip = (formData: any) => {
    const newTrip: Trip = {
      id: createId(),
      name: formData.name,
      description: formData.description,
      startLocation: formData.startLocation,
      destinations: formData.destinations.split(',').map((d: string) => d.trim()).filter(Boolean),
      startDate: formData.startDate,
      endDate: formData.endDate,
      travellers: Number(formData.travellers),
      travelMode: formData.travelMode,
      budget: Number(formData.budget),
      currency: formData.currency,
      coverImage: formData.coverImage || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1500&q=80',
      visibility: formData.visibility,
      completed: false,
      stats: {
        totalPlaces: 0,
        visitedPlaces: 0,
        skippedPlaces: 0,
        days: 0,
        photos: 0,
        videos: 0,
        expenses: 0
      },
      itinerary: {},
      destinationsList: [],
      expenses: [],
      memories: []
    }
    setTrips((prev) => [newTrip, ...prev])
    setSelectedTrip(newTrip)
    setCurrentView('trip')
  }

  const addExpense = () => {
    if (!newExpense.title.trim()) return
    const item: Expense = {
      id: createId(),
      title: newExpense.title,
      amount: Number(newExpense.amount || 0),
      currency: newExpense.currency,
      date: newExpense.date,
      category: newExpense.category,
      paymentMethod: newExpense.paymentMethod,
      destination: newExpense.destination,
      payer: newExpense.payer,
      notes: newExpense.notes
    }
    const updatedTrip = {
      ...selectedTrip,
      expenses: [item, ...selectedTrip.expenses],
      stats: {
        ...selectedTrip.stats,
        expenses: selectedTrip.expenses.reduce((sum, exp) => sum + exp.amount, 0) + item.amount
      }
    }
    setSelectedTrip(updatedTrip)
    setTrips((prev) => prev.map((trip) => (trip.id === updatedTrip.id ? updatedTrip : trip)))
    setNewExpense({
      title: '',
      amount: '',
      currency: 'INR',
      date: new Date().toISOString().slice(0, 10),
      category: 'Transport',
      paymentMethod: 'UPI',
      destination: 'Baga',
      payer: 'Aditi',
      notes: ''
    })
  }

  const markDestinationVisited = (id: string) => {
    const updated = {
      ...selectedTrip,
      destinationsList: selectedTrip.destinationsList.map((item) =>
        item.id === id
          ? { ...item, status: 'Visited', actualVisitDate: new Date().toISOString().slice(0, 10), notes: `${item.notes} Visited on ${new Date().toLocaleDateString()}` }
          : item
      )
    }
    setSelectedTrip(updated)
    setTrips((prev) => prev.map((trip) => (trip.id === updated.id ? updated : trip)))
  }

  const completeJourney = () => {
    const updated = {
      ...selectedTrip,
      completed: true,
      completionDate: new Date().toISOString().slice(0, 10),
      stats: {
        ...selectedTrip.stats,
        totalPlaces: selectedTrip.destinationsList.length,
        visitedPlaces: selectedTrip.destinationsList.filter((d) => d.status === 'Visited').length,
        skippedPlaces: selectedTrip.destinationsList.filter((d) => d.status === 'Skipped').length,
        photos: selectedTrip.destinationsList.reduce((sum, d) => sum + d.photos, 0),
        videos: 12,
        expenses: selectedTrip.expenses.reduce((sum, item) => sum + item.amount, 0)
      }
    }
    setSelectedTrip(updated)
    setTrips((prev) => prev.map((trip) => (trip.id === updated.id ? updated : trip)))
  }

  const exportFile = (type: 'zip' | 'pdf' | 'excel' | 'json') => {
    if (type === 'json') {
      const blob = new Blob([JSON.stringify(selectedTrip, null, 2)], { type: 'application/json' })
      saveAs(blob, `${selectedTrip.name.toLowerCase().replace(/\s+/g, '_')}.json`)
      return
    }

    if (type === 'excel') {
      const ws = XLSX.utils.json_to_sheet(selectedTrip.expenses)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Expenses')
      XLSX.writeFile(wb, `${selectedTrip.name.toLowerCase().replace(/\s+/g, '_')}_expenses.xlsx`)
      return
    }

    if (type === 'pdf') {
      const pdf = new jsPDF()
      pdf.setFontSize(20)
      pdf.text(selectedTrip.name, 18, 20)
      pdf.setFontSize(12)
      pdf.text(`Dates: ${selectedTrip.startDate} - ${selectedTrip.endDate}`, 18, 32)
      pdf.text(`Travel Mode: ${selectedTrip.travelMode}`, 18, 40)
      pdf.text(`Trip Budget: ${formatCurrency(selectedTrip.budget, selectedTrip.currency)}`, 18, 48)
      pdf.text(`Trips completed: ${selectedTrip.completed ? 'Yes' : 'No'}`, 18, 56)
      pdf.text('Trip summary generated by TripVault.', 18, 72)
      pdf.save(`${selectedTrip.name.toLowerCase().replace(/\s+/g, '_')}.pdf`)
      return
    }

    const zipBlob = new Blob(['TripVault export package placeholder for ' + selectedTrip.name], { type: 'application/zip' })
    saveAs(zipBlob, `${selectedTrip.name.toLowerCase().replace(/\s+/g, '_')}.zip`)
  }

  const handleLogin = () => setLoggedIn(true)

  const renderLanding = () => (
    <div className={cn('min-h-screen bg-navy text-cream', darkMode && 'dark')}>
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange to-beige text-navy shadow-lg">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold">TripVault</p>
            <p className="text-xs text-cream/70">Plan. Explore. Capture. Relive.</p>
          </div>
        </div>

        <nav className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm text-cream/80 hover:text-white">Features</a>
          <a href="#journey" className="text-sm text-cream/80 hover:text-white">Journey</a>
          <a href="#archive" className="text-sm text-cream/80 hover:text-white">Archive</a>
          <button onClick={() => setCurrentView('dashboard')} className="rounded-full bg-orange px-4 py-2 text-sm font-semibold text-navy">Open App</button>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-16 pt-10">
        <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-orange">
              <Sparkles className="h-3.5 w-3.5" /> Premium Travel OS
            </span>
            <h1 className="mt-6 max-w-xl font-serif text-5xl leading-tight text-white md:text-6xl">
              Every trip begins as a plan and becomes a permanent memory.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-cream/80">
              Build itineraries, track destinations, capture memories, manage budgets and turn each adventure into a beautiful downloadable journey project.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <button onClick={() => setCurrentView('dashboard')} className="rounded-full bg-orange px-6 py-3 font-semibold text-navy shadow-lg shadow-orange/20 transition hover:scale-[1.02]">Start planning</button>
              <button onClick={() => setCurrentView('dashboard')} className="rounded-full border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white">View dashboard</button>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Trips managed', value: '2.8K+' },
                { label: 'Cities explored', value: '140+' },
                { label: 'Memories stored', value: '58K' }
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-cream/65">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-[32px] border border-white/10 bg-white/5 p-4 shadow-2xl shadow-navy/40">
            <img
              src="https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?auto=format&fit=crop&w=1200&q=80"
              alt="Travel scenic destination"
              className="h-[430px] w-full rounded-[28px] object-cover"
            />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {[
                { icon: Plane, label: 'Upcoming trips' },
                { icon: MapPinned, label: 'Live route planning' },
                { icon: Camera, label: 'Media archive' },
                { icon: Wallet, label: 'Smart budget' }
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-slate-900/30 p-3 text-sm text-cream/80">
                  <Icon className="mb-2 h-4 w-4 text-orange" /> {label}
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        <section id="features" className="mt-20 grid gap-6 md:grid-cols-3">
          {[
            { title: 'Plan with precision', description: 'Create multi-destination journeys, day-wise itinerary flow and completeness tracking.', icon: CalendarClock },
            { title: 'Track your story', description: 'Capture memories, GPS notes, media and completion milestones across the whole journey.', icon: Camera },
            { title: 'Archive beautifully', description: 'Export a polished PDF, ZIP, spreadsheet and JSON archive for every trip.', icon: Download }
          ].map(({ title, description, icon: Icon }) => (
            <div key={title} className="rounded-[28px] border border-white/10 bg-white/5 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange/10 text-orange">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm text-cream/75">{description}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  )

  const renderAuth = () => (
    <div className="min-h-screen bg-cream px-4 py-10">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-premium">
        <div className="grid lg:grid-cols-2">
          <div className="relative hidden min-h-[600px] bg-navy p-8 lg:block">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(233,154,82,0.2),transparent_32%),linear-gradient(135deg,#101B2D,#183D35)]" />
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="flex items-center gap-3 text-white">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange text-navy"><Compass className="h-5 w-5" /></div>
                <div>
                  <p className="text-lg font-semibold">TripVault</p>
                  <p className="text-xs text-cream/70">Travel memory vault</p>
                </div>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-orange">Your next adventure</p>
                <h2 className="mt-5 max-w-xs font-serif text-4xl text-white">Capture the details worth keeping forever.</h2>
                <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-cream/80">
                  “We planned every day, tracked our route, uploaded our memories and exported our complete travel archive in one place.”
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center p-8 md:p-12">
            <div className="w-full max-w-md">
              <div className="mb-8">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange">Welcome back</p>
                <h3 className="mt-3 text-3xl font-bold text-navy">Sign in to your journey</h3>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Email address</span>
                  <input defaultValue="aditi@tripvault.io" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange/60" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
                  <input type="password" defaultValue="password123" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange/60" />
                </label>
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-slate-600"><input type="checkbox" /> Remember me</label>
                  <button className="text-orange">Forgot password?</button>
                </div>
                <button onClick={handleLogin} className="w-full rounded-2xl bg-navy px-4 py-3 font-semibold text-white shadow-lg shadow-navy/20">Sign in</button>
                <button onClick={() => setCurrentView('dashboard')} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700">Continue as guest</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderDashboard = () => (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white/80 p-4 shadow-premium md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-orange">Dashboard</p>
          <h2 className="mt-1 text-3xl font-bold text-navy">Welcome back, Aditi</h2>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search trips" className="w-full rounded-full border border-slate-200 bg-slate-50 pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange/60 sm:w-52" />
          </div>
          <button onClick={() => setCurrentView('trip')} className="inline-flex items-center justify-center gap-2 rounded-full bg-navy px-4 py-2.5 font-semibold text-white"><Plus className="h-4 w-4" />New trip</button>
        </div>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'Total trips', value: trips.length, icon: MapPinned, tone: 'bg-navy text-white' },
          { label: 'Upcoming', value: upcomingTrips, icon: CalendarClock, tone: 'bg-forest text-white' },
          { label: 'Completed', value: completedTrips, icon: CheckCircle2, tone: 'bg-orange text-white' },
          { label: 'Places visited', value: totalVisited, icon: Route, tone: 'bg-beige text-navy' },
          { label: 'Expenses', value: formatCurrency(totalExpenses, 'INR'), icon: Wallet, tone: 'bg-cream text-navy' }
        ].map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-premium">
            <div className={cn('mb-4 flex h-11 w-11 items-center justify-center rounded-2xl', tone)}><Icon className="h-5 w-5" /></div>
            <p className="text-3xl font-bold text-navy">{value}</p>
            <p className="mt-2 text-sm text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-[32px] border border-slate-200 bg-white/80 p-5 shadow-premium">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-bold text-navy">Upcoming journeys</h3>
              <button className="text-sm font-medium text-orange">View all</button>
            </div>
            <div className="space-y-4">
              {filteredTrips.map((trip) => (
                <div key={trip.id} className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50">
                  <div className="grid md:grid-cols-[220px_1fr]">
                    <img src={trip.coverImage} alt={trip.name} className="h-full w-full object-cover" />
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm uppercase tracking-[0.16em] text-orange">{trip.travelMode}</p>
                          <h4 className="mt-1 text-xl font-bold text-navy">{trip.name}</h4>
                        </div>
                        <button onClick={() => { setSelectedTrip(trip); setCurrentView('trip'); }} className="rounded-full bg-navy px-3 py-1.5 text-sm font-medium text-white">Open</button>
                      </div>
                      <p className="mt-3 text-sm text-slate-600">{trip.description}</p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Dates</p>
                          <p className="mt-1 text-sm font-semibold text-slate-700">{trip.startDate} → {trip.endDate}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Destinations</p>
                          <p className="mt-1 text-sm font-semibold text-slate-700">{trip.destinations.length}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Budget</p>
                          <p className="mt-1 text-sm font-semibold text-slate-700">{formatCurrency(trip.budget, trip.currency)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[32px] border border-slate-200 bg-white/80 p-5 shadow-premium">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-bold text-navy">Quick actions</h3>
              <button className="text-sm text-orange">Explore more</button>
            </div>
            <div className="space-y-3">
              {[
                { title: 'Create trip', icon: Plus },
                { title: 'Explore map', icon: Map },
                { title: 'Open archive', icon: FileText },
                { title: 'Share project', icon: Share2 }
              ].map(({ title, icon: Icon }) => (
                <button key={title} className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left hover:border-orange/50">
                  <span className="flex items-center gap-3 font-medium text-slate-700"><Icon className="h-4 w-4 text-orange" />{title}</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white/80 p-5 shadow-premium">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-bold text-navy">Recent completed</h3>
              <button onClick={() => setCurrentView('archive')} className="text-sm text-orange">Archive</button>
            </div>
            <div className="space-y-4">
              {trips.filter((trip) => trip.completed).map((trip) => (
                <div key={trip.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-700">{trip.name}</p>
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">Completed</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{trip.destinations.length} destinations • {trip.stats.photos} photos</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderCreateTrip = () => (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-premium">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-orange">Create trip</p>
            <h2 className="mt-2 text-3xl font-bold text-navy">Build your next journey</h2>
          </div>
          <button onClick={() => setCurrentView('dashboard')} className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600">Back to dashboard</button>
        </div>

        <TripCreationForm onSubmit={createTrip} />
      </div>
    </div>
  )

  const renderTripWorkspace = () => (
    <div className="p-4 md:p-6">
      <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white/80 shadow-premium">
        <div className="relative h-64 md:h-80">
          <img src={selectedTrip.coverImage} alt={selectedTrip.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/15 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-orange">Trip workspace</p>
                <h2 className="mt-2 text-3xl font-bold text-white md:text-4xl">{selectedTrip.name}</h2>
              </div>
              <div className="flex gap-2">
                <button onClick={() => exportFile('pdf')} className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">Export PDF</button>
                <button onClick={completeJourney} className="rounded-full bg-orange px-5 py-2.5 text-sm font-bold text-navy">Finish journey</button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-slate-200 bg-slate-50/80 p-3">
          <div className="flex flex-wrap gap-2">
            {[
              ['overview', 'Overview'],
              ['itinerary', 'Itinerary'],
              ['destinations', 'Destinations'],
              ['map', 'Map'],
              ['memories', 'Memories'],
              ['media', 'Photos & Videos'],
              ['expenses', 'Expenses'],
              ['documents', 'Documents'],
              ['report', 'Journey Report']
            ].map(([key, label]) => (
              <button key={key} onClick={() => setTripTab(key as ActivityTab)} className={cn('rounded-full px-4 py-2 text-sm font-medium', tripTab === key ? 'bg-navy text-white' : 'bg-white text-slate-600')}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 md:p-6">
          {tripTab === 'overview' && <TripOverview trip={selectedTrip} />}
          {tripTab === 'itinerary' && <TripItinerary trip={selectedTrip} />}
          {tripTab === 'destinations' && <TripDestinations trip={selectedTrip} onVisit={markDestinationVisited} />}
          {tripTab === 'map' && <TripMap trip={selectedTrip} />}
          {tripTab === 'memories' && <TripMemories trip={selectedTrip} />}
          {tripTab === 'media' && <TripMedia trip={selectedTrip} />}
          {tripTab === 'expenses' && <TripExpenses trip={selectedTrip} newExpense={newExpense} setNewExpense={setNewExpense} onAdd={addExpense} />}
          {tripTab === 'documents' && <TripDocuments />}
          {tripTab === 'report' && <JourneyReport trip={selectedTrip} onExport={exportFile} />}
        </div>
      </div>
    </div>
  )

  const renderArchive = () => (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white/80 p-4 shadow-premium md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-orange">Journey archive</p>
          <h2 className="mt-2 text-3xl font-bold text-navy">Completed trips and saved projects</h2>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setCurrentView('dashboard')} className="rounded-full border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700">Dashboard</button>
          <button onClick={() => setCurrentView('trip')} className="rounded-full bg-navy px-4 py-2.5 text-sm font-medium text-white">Open workspace</button>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {trips.map((trip) => (
          <div key={trip.id} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white/85 shadow-premium">
            <img src={trip.coverImage} alt={trip.name} className="h-52 w-full object-cover" />
            <div className="p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-bold text-navy">{trip.name}</h3>
                {trip.completed ? <span className="rounded-full bg-green-100 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-green-700">Archive</span> : <span className="rounded-full bg-orange/15 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-orange">Live</span>}
              </div>
              <p className="mt-2 text-sm text-slate-600">{trip.destinations.length} destinations • {trip.stats.photos} photos</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
                <div><span className="block text-xs uppercase tracking-[0.12em] text-slate-400">Dates</span>{trip.startDate}</div>
                <div><span className="block text-xs uppercase tracking-[0.12em] text-slate-400">Visited</span>{trip.stats.visitedPlaces}</div>
              </div>
              <div className="mt-5 flex gap-2">
                <button onClick={() => { setSelectedTrip(trip); setCurrentView('trip'); }} className="flex-1 rounded-full bg-navy px-4 py-2 text-sm font-medium text-white">Open</button>
                <button onClick={() => exportFile('zip')} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600">ZIP</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderProfile = () => (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <div className="rounded-[32px] border border-slate-200 bg-white/80 p-6 shadow-premium">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <img src={initialUser.avatar} alt={initialUser.name} className="h-20 w-20 rounded-full object-cover" />
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-orange">Profile</p>
              <h2 className="mt-1 text-3xl font-bold text-navy">{initialUser.name}</h2>
              <p className="text-sm text-slate-500">{initialUser.email}</p>
            </div>
          </div>
          <button onClick={() => setLoggedIn(false)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"><LogOut className="h-4 w-4" />Sign out</button>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Card title="Travel preferences">
            <div className="space-y-4">
              <Field label="Primary travel style" value="Beach + heritage" />
              <Field label="Preferred currency" value="INR" />
              <Field label="Theme" value="Premium magazine" />
            </div>
          </Card>

          <Card title="Account settings">
            <div className="space-y-4">
              <Field label="Notifications" value="Enabled" />
              <Field label="Sharing" value="Trips are private by default" />
              <Field label="Storage" value="6.4 GB / 10 GB" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )

  const navItems = [
    { label: 'Dashboard', view: 'dashboard', icon: LayoutDashboard },
    { label: 'Trip workspace', view: 'trip', icon: Briefcase },
    { label: 'Archive', view: 'archive', icon: FileText },
    { label: 'Profile', view: 'profile', icon: UserCircle2 }
  ] as const

  const shell = (
    <div className={cn('min-h-screen bg-cream text-slate-800', darkMode && 'bg-slate-900 text-slate-100')}>
      <div className="mx-auto max-w-[1600px]">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-3 md:px-6">
            <div className="flex items-center gap-3">
              <button className="rounded-xl border border-slate-200 p-2 md:hidden" onClick={() => setMobileMenuOpen((value) => !value)}>
                <Menu className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange to-beige text-navy">
                  <Compass className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-bold text-navy">TripVault</p>
                </div>
              </div>
            </div>

            <nav className="hidden items-center gap-2 md:flex">
              {navItems.map(({ label, view, icon: Icon }) => (
                <button key={label} onClick={() => setCurrentView(view)} className={cn('flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition', currentView === view ? 'bg-navy text-white' : 'text-slate-600 hover:bg-slate-100')}>
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <button className="rounded-full border border-slate-200 p-2.5 text-slate-600" aria-label="Notifications">
                <Bell className="h-4 w-4" />
              </button>
              <button onClick={() => setDarkMode((value) => !value)} className="rounded-full border border-slate-200 p-2.5 text-slate-600">
                {darkMode ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
              </button>
              <div className="hidden items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-2 py-1.5 md:flex">
                <img src={initialUser.avatar} alt={initialUser.name} className="h-8 w-8 rounded-full object-cover" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-navy">{initialUser.name}</p>
                  <p className="text-[10px] uppercase tracking-[0.13em] text-slate-400">Traveller</p>
                </div>
              </div>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
              <div className="space-y-2">
                {navItems.map(({ label, view, icon: Icon }) => (
                  <button key={label} onClick={() => { setCurrentView(view); setMobileMenuOpen(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-slate-700 hover:bg-slate-100">
                    <Icon className="h-4 w-4 text-orange" />{label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </header>

        {loggedIn ? (
          <main>
            {currentView === 'landing' && renderLanding()}
            {currentView === 'dashboard' && renderDashboard()}
            {currentView === 'trip' && renderTripWorkspace()}
            {currentView === 'archive' && renderArchive()}
            {currentView === 'profile' && renderProfile()}
          </main>
        ) : (
          <main>{renderAuth()}</main>
        )}
      </div>
    </div>
  )

  return (
    <Routes>
      <RouterRoute path="/" element={shell} />
      <RouterRoute path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-700">{value}</p>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
      <h3 className="text-lg font-bold text-navy">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  )
}

function TripCreationForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [form, setForm] = useState({
    name: 'Kashmir Escape',
    description: 'Snowy valleys, houseboats and mountain drives across the Himalayas.',
    startLocation: 'Delhi',
    destinations: 'Srinagar, Gulmarg, Pahalgam',
    startDate: '2026-12-18',
    endDate: '2026-12-26',
    travellers: 3,
    travelMode: 'Car',
    budget: 140000,
    currency: 'INR',
    coverImage: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1400&q=80',
    visibility: 'Private'
  })

  const handle = (field: string, value: string | number) => setForm((prev) => ({ ...prev, [field]: value }))

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form)
      }}
      className="grid gap-5 md:grid-cols-2"
    >
      <label className="md:col-span-2">
        <span className="mb-2 block text-sm font-medium text-slate-600">Trip name</span>
        <input value={form.name} onChange={(e) => handle('name', e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
      </label>

      <label className="md:col-span-2">
        <span className="mb-2 block text-sm font-medium text-slate-600">Description</span>
        <textarea value={form.description} onChange={(e) => handle('description', e.target.value)} className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
      </label>

      <label>
        <span className="mb-2 block text-sm font-medium text-slate-600">Starting location</span>
        <input value={form.startLocation} onChange={(e) => handle('startLocation', e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
      </label>

      <label>
        <span className="mb-2 block text-sm font-medium text-slate-600">Destinations</span>
        <input value={form.destinations} onChange={(e) => handle('destinations', e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
      </label>

      <label>
        <span className="mb-2 block text-sm font-medium text-slate-600">Start date</span>
        <input type="date" value={form.startDate} onChange={(e) => handle('startDate', e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
      </label>

      <label>
        <span className="mb-2 block text-sm font-medium text-slate-600">End date</span>
        <input type="date" value={form.endDate} onChange={(e) => handle('endDate', e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
      </label>

      <label>
        <span className="mb-2 block text-sm font-medium text-slate-600">Travellers</span>
        <input type="number" value={form.travellers} onChange={(e) => handle('travellers', Number(e.target.value))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
      </label>

      <label>
        <span className="mb-2 block text-sm font-medium text-slate-600">Travel mode</span>
        <select value={form.travelMode} onChange={(e) => handle('travelMode', e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          {['Car', 'Bike', 'Bus', 'Train', 'Flight', 'Walking'].map((mode) => (
            <option key={mode} value={mode}>{mode}</option>
          ))}
        </select>
      </label>

      <label>
        <span className="mb-2 block text-sm font-medium text-slate-600">Estimated budget</span>
        <input type="number" value={form.budget} onChange={(e) => handle('budget', Number(e.target.value))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
      </label>

      <label>
        <span className="mb-2 block text-sm font-medium text-slate-600">Currency</span>
        <select value={form.currency} onChange={(e) => handle('currency', e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          {['INR', 'USD', 'EUR', 'AED', 'GBP'].map((currency) => (
            <option key={currency} value={currency}>{currency}</option>
          ))}
        </select>
      </label>

      <label className="md:col-span-2">
        <span className="mb-2 block text-sm font-medium text-slate-600">Trip cover image URL</span>
        <input value={form.coverImage} onChange={(e) => handle('coverImage', e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
      </label>

      <label>
        <span className="mb-2 block text-sm font-medium text-slate-600">Visibility</span>
        <select value={form.visibility} onChange={(e) => handle('visibility', e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <option value="Private">Private</option>
          <option value="Shared">Shared</option>
        </select>
      </label>

      <div className="md:col-span-2 flex justify-end">
        <button type="submit" className="rounded-full bg-navy px-6 py-3 font-semibold text-white">Create trip</button>
      </div>
    </form>
  )
}

function TripOverview({ trip }: { trip: Trip }) {
  const completion = Math.min(100, Math.round((trip.stats.visitedPlaces / Math.max(1, trip.stats.totalPlaces)) * 100))

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Trip duration', value: `${trip.startDate} → ${trip.endDate}` },
          { label: 'Destination count', value: String(trip.destinationsList.length || trip.destinations.length) },
          { label: 'Visited places', value: String(trip.stats.visitedPlaces) },
          { label: 'Completion', value: `${completion}%` }
        ].map((stat) => (
          <div key={stat.label} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-400">{stat.label}</p>
            <p className="mt-2 text-xl font-bold text-slate-800">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
          <p className="text-lg font-bold text-navy">Trip summary</p>
          <p className="mt-3 text-sm leading-7 text-slate-600">{trip.description}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <FieldBlock label="Start" value={trip.startLocation} />
            <FieldBlock label="Travel mode" value={trip.travelMode} />
            <FieldBlock label="Travellers" value={String(trip.travellers)} />
            <FieldBlock label="Budget" value={`${formatCurrency(trip.budget, trip.currency)}`} />
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
          <p className="text-lg font-bold text-navy">Progress</p>
          <div className="mt-6 overflow-hidden rounded-full bg-slate-200">
            <div className="h-3 rounded-full bg-gradient-to-r from-orange to-forest" style={{ width: `${completion}%` }} />
          </div>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between"><span>Pending</span><span>{Math.max(0, trip.stats.totalPlaces - trip.stats.visitedPlaces)}</span></div>
            <div className="flex items-center justify-between"><span>Visited</span><span>{trip.stats.visitedPlaces}</span></div>
            <div className="flex items-center justify-between"><span>Skipped</span><span>{trip.stats.skippedPlaces}</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FieldBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-700">{value}</p>
    </div>
  )
}

function TripItinerary({ trip }: { trip: Trip }) {
  return (
    <div className="space-y-6">
      {Object.entries(trip.itinerary).length === 0 ? (
        <EmptyState text="No itinerary yet — add activity blocks to shape your travel plan." />
      ) : (
        Object.entries(trip.itinerary).map(([day, activities]) => (
          <div key={day} className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-navy">{day}</h3>
              <button className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">Add activity</button>
            </div>
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="rounded-[24px] border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-slate-800">{activity.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{activity.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><Pencil className="h-4 w-4" /></button>
                      <button className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <InfoSmall label="Time" value={`${activity.startTime} – ${activity.endTime}`} />
                    <InfoSmall label="Duration" value={activity.duration} />
                    <InfoSmall label="Priority" value={activity.priority} />
                  </div>
                  <div className="mt-3 text-sm text-slate-600">{activity.address}</div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function InfoSmall({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2.5">
      <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-700">{value}</p>
    </div>
  )
}

function TripDestinations({ trip, onVisit }: { trip: Trip; onVisit: (id: string) => void }) {
  const [filter, setFilter] = useState<'All' | TripStatus>('All')
  const destinations = filter === 'All' ? trip.destinationsList : trip.destinationsList.filter((destination) => destination.status === filter)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {['All', 'Planned', 'In Progress', 'Visited', 'Skipped'].map((item) => (
          <button key={item} onClick={() => setFilter(item as 'All' | TripStatus)} className={cn('rounded-full px-3 py-1.5 text-sm font-medium', filter === item ? 'bg-navy text-white' : 'bg-slate-100 text-slate-600')}>
            {item}
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {destinations.map((destination) => (
          <div key={destination.id} className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-bold text-slate-800">{destination.name}</p>
                <p className="text-sm text-slate-500">{destination.address}</p>
              </div>
              <span className={cn('rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]', destination.status === 'Visited' ? 'bg-green-100 text-green-700' : destination.status === 'Skipped' ? 'bg-red-100 text-red-700' : 'bg-orange/10 text-orange')}>{destination.status}</span>
            </div>
            <p className="mt-3 text-sm text-slate-600">{destination.description}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <InfoSmall label="Planned date" value={destination.plannedDate} />
              <InfoSmall label="Visit time" value={destination.visitingTime} />
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => onVisit(destination.id)} className="rounded-full bg-navy px-4 py-2 text-sm font-medium text-white">Mark visited</button>
              <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600">Add notes</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TripMap({ trip }: { trip: Trip }) {
  const positions = trip.destinationsList.map((destination) => [destination.coordinates.lat, destination.coordinates.lng] as [number, number])
  const center: [number, number] = positions[0] || [15.4909, 73.8278]

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="h-[520px] overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50">
        <MapContainer center={center} zoom={9} scrollWheelZoom className="h-full w-full">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {trip.destinationsList.map((destination) => (
            <Marker key={destination.id} position={[destination.coordinates.lat, destination.coordinates.lng]}>
              <Popup>{destination.name}</Popup>
            </Marker>
          ))}
          {positions.length > 1 && <Polyline positions={positions} pathOptions={{ color: '#E99A52', weight: 4 }} />}
        </MapContainer>
      </div>
      <div className="space-y-4">
        {trip.destinationsList.map((destination) => (
          <div key={destination.id} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
            <p className="font-semibold text-slate-800">{destination.name}</p>
            <p className="mt-1 text-sm text-slate-500">{destination.address}</p>
            <button className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600"><LocateFixed className="h-3.5 w-3.5" />Open in maps</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function TripMemories({ trip }: { trip: Trip }) {
  return (
    <div className="space-y-5">
      {trip.memories.length === 0 ? (
        <EmptyState text="Add memories and personal notes to build a rich travel diary." />
      ) : (
        trip.memories.map((memory) => (
          <div key={memory.id} className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xl font-bold text-slate-800">{memory.title}</p>
                <p className="mt-1 text-sm text-slate-500">{memory.location}</p>
              </div>
              <button className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600">Edit</button>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-600">{memory.description}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <InfoSmall label="Date" value={memory.date} />
              <InfoSmall label="Time" value={memory.time} />
              <InfoSmall label="Media" value={`${memory.mediaCount} files`} />
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function TripMedia({ trip }: { trip: Trip }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-5">
        <div>
          <p className="text-lg font-semibold text-slate-800">Upload photos and videos</p>
          <p className="text-sm text-slate-500">Trip → Day → Destination → Media</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-sm font-medium text-white"><UploadCloud className="h-4 w-4" />Upload media</button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50">
            <img src={trip.coverImage} alt={`${trip.name} media ${index + 1}`} className="h-48 w-full object-cover" />
            <div className="p-3 text-sm text-slate-600">Media item {index + 1}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TripExpenses({ trip, newExpense, setNewExpense, onAdd }: { trip: Trip; newExpense: any; setNewExpense: any; onAdd: () => void }) {
  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
        <p className="text-lg font-bold text-navy">Expense tracker</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Budget', value: formatCurrency(trip.budget, trip.currency) },
            { label: 'Actual', value: formatCurrency(trip.expenses.reduce((sum, item) => sum + item.amount, 0), trip.currency) },
            { label: 'Remaining', value: formatCurrency(trip.budget - trip.expenses.reduce((sum, item) => sum + item.amount, 0), trip.currency) },
            { label: 'Categories', value: String(new Set(trip.expenses.map((item) => item.category)).size) }
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-3">
              <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">{stat.label}</p>
              <p className="mt-2 text-lg font-bold text-slate-800">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
        <p className="text-lg font-bold text-navy">Add expense</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <input value={newExpense.title} onChange={(e) => setNewExpense((prev: any) => ({ ...prev, title: e.target.value }))} placeholder="Expense title" className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5" />
          <input value={newExpense.amount} onChange={(e) => setNewExpense((prev: any) => ({ ...prev, amount: e.target.value }))} placeholder="Amount" type="number" className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5" />
          <input type="date" value={newExpense.date} onChange={(e) => setNewExpense((prev: any) => ({ ...prev, date: e.target.value }))} className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5" />
          <select value={newExpense.category} onChange={(e) => setNewExpense((prev: any) => ({ ...prev, category: e.target.value }))} className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
            {['Transport', 'Accommodation', 'Food', 'Tickets', 'Shopping', 'Fuel', 'Other'].map((item) => <option key={item}>{item}</option>)}
          </select>
          <input value={newExpense.destination} onChange={(e) => setNewExpense((prev: any) => ({ ...prev, destination: e.target.value }))} placeholder="Destination" className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5" />
          <input value={newExpense.payer} onChange={(e) => setNewExpense((prev: any) => ({ ...prev, payer: e.target.value }))} placeholder="Payer" className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5" />
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={onAdd} className="rounded-full bg-navy px-5 py-2.5 text-sm font-medium text-white">Add expense</button>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
        <p className="text-lg font-bold text-navy">Expense entries</p>
        <div className="mt-4 space-y-3">
          {trip.expenses.map((item) => (
            <div key={item.id} className="flex flex-col gap-3 rounded-[22px] border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold text-slate-800">{item.title}</p>
                <p className="text-sm text-slate-500">{item.category} • {item.destination}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-slate-800">{formatCurrency(item.amount, item.currency)}</p>
                <p className="text-xs text-slate-400">{item.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TripDocuments() {
  return (
    <div className="space-y-5">
      {['Trip itinerary notes', 'Hotel booking confirmations', 'Reservations', 'Packing checklist'].map((doc) => (
        <div key={doc} className="flex items-center justify-between rounded-[24px] border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange/10 text-orange"><FileText className="h-4 w-4" /></div>
            <div>
              <p className="font-semibold text-slate-800">{doc}</p>
              <p className="text-sm text-slate-500">Uploaded with travel plan</p>
            </div>
          </div>
          <button className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600">View</button>
        </div>
      ))}
    </div>
  )
}

function JourneyReport({ trip, onExport }: { trip: Trip; onExport: (type: 'zip' | 'pdf' | 'excel' | 'json') => void }) {
  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
        <p className="text-lg font-bold text-navy">Final journey report</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Destinations', value: String(trip.destinationsList.length) },
            { label: 'Photos', value: String(trip.stats.photos) },
            { label: 'Videos', value: String(trip.stats.videos) },
            { label: 'Total spend', value: formatCurrency(trip.stats.expenses, trip.currency) }
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-3">
              <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">{stat.label}</p>
              <p className="mt-2 text-xl font-bold text-slate-800">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
        <p className="text-lg font-bold text-navy">Download project bundle</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={() => onExport('pdf')} className="rounded-full bg-navy px-4 py-2 text-sm font-medium text-white">PDF</button>
          <button onClick={() => onExport('zip')} className="rounded-full bg-forest px-4 py-2 text-sm font-medium text-white">ZIP</button>
          <button onClick={() => onExport('excel')} className="rounded-full bg-orange px-4 py-2 text-sm font-medium text-white">Excel</button>
          <button onClick={() => onExport('json')} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600">JSON</button>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500">
      {text}
    </div>
  )
}

export default App

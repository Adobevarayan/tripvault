export type TripStatus = 'Planned' | 'In Progress' | 'Visited' | 'Skipped'

export type Destination = {
  id: string
  name: string
  description: string
  address: string
  plannedDate: string
  visitingTime: string
  actualVisitDate?: string
  notes: string
  status: TripStatus
  coordinates: { lat: number; lng: number }
  photos: number
}

export type Activity = {
  id: string
  name: string
  description: string
  date: string
  startTime: string
  endTime: string
  duration: string
  address: string
  coordinates: { lat: number; lng: number }
  estimatedExpense: number
  priority: 'Low' | 'Medium' | 'High'
  notes: string
}

export type Expense = {
  id: string
  title: string
  amount: number
  currency: string
  date: string
  category: 'Transport' | 'Accommodation' | 'Food' | 'Tickets' | 'Shopping' | 'Fuel' | 'Other'
  paymentMethod: string
  destination: string
  payer: string
  notes: string
}

export type Memory = {
  id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  notes: string
  mediaCount: number
}

export type Trip = {
  id: string
  name: string
  description: string
  startLocation: string
  destinations: string[]
  startDate: string
  endDate: string
  travellers: number
  travelMode: 'Car' | 'Bike' | 'Bus' | 'Train' | 'Flight' | 'Walking'
  budget: number
  currency: string
  coverImage: string
  visibility: 'Private' | 'Shared'
  completed: boolean
  completionDate?: string
  stats: {
    totalPlaces: number
    visitedPlaces: number
    skippedPlaces: number
    days: number
    photos: number
    videos: number
    expenses: number
  }
  itinerary: Record<string, Activity[]>
  destinationsList: Destination[]
  expenses: Expense[]
  memories: Memory[]
}

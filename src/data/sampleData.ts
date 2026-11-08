import type { Trip } from '../types'

export const sampleTrip: Trip = {
  id: 'trip-goa-01',
  name: 'Goa Adventure',
  description: 'A vibrant coastal escape through beaches, heritage towns and vibrant nightlife.',
  startLocation: 'Bengaluru',
  destinations: ['Panaji', 'Anjuna Beach', 'Old Goa', 'Palolem', 'Arambol'],
  startDate: '2026-11-16',
  endDate: '2026-11-22',
  travellers: 2,
  travelMode: 'Flight',
  budget: 180000,
  currency: 'INR',
  coverImage:
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80',
  visibility: 'Private',
  completed: false,
  stats: {
    totalPlaces: 5,
    visitedPlaces: 2,
    skippedPlaces: 1,
    days: 6,
    photos: 48,
    videos: 7,
    expenses: 126500
  },
  itinerary: {
    'Day 01': [
      {
        id: 'act-1',
        name: 'Airport pickup and hotel check-in',
        description: 'Arrive and settle into the beach resort.',
        date: '2026-11-16',
        startTime: '08:00 AM',
        endTime: '09:30 AM',
        duration: '1.5 hours',
        address: 'Dabolim Airport, Goa',
        coordinates: { lat: 15.3808, lng: 73.8318 },
        estimatedExpense: 1800,
        priority: 'High',
        notes: 'Carry local SIM and cash.'
      },
      {
        id: 'act-2',
        name: 'Baga Beach walk',
        description: 'Sunrise stroll and coffee by the shore.',
        date: '2026-11-16',
        startTime: '09:45 AM',
        endTime: '11:15 AM',
        duration: '1.5 hours',
        address: 'Baga Beach, Goa',
        coordinates: { lat: 15.5577, lng: 73.7513 },
        estimatedExpense: 900,
        priority: 'Medium',
        notes: 'Check tide timings.'
      }
    ],
    'Day 02': [
      {
        id: 'act-3',
        name: 'Old Goa heritage walk',
        description: 'Explore churches and heritage architecture.',
        date: '2026-11-17',
        startTime: '09:00 AM',
        endTime: '12:30 PM',
        duration: '3.5 hours',
        address: 'Old Goa',
        coordinates: { lat: 15.5029, lng: 73.9122 },
        estimatedExpense: 1200,
        priority: 'High',
        notes: 'Bring sunscreen and hats.'
      }
    ]
  },
  destinationsList: [
    {
      id: 'place-1',
      name: 'Panaji',
      description: 'Historic capital city and waterfront promenade.',
      address: 'Panaji, Goa',
      plannedDate: '2026-11-16',
      visitingTime: '10:00 AM',
      actualVisitDate: '2026-11-16',
      notes: 'Enjoy the pedestrian walkway and local cuisine.',
      status: 'Visited',
      coordinates: { lat: 15.4909, lng: 73.8278 },
      photos: 12
    },
    {
      id: 'place-2',
      name: 'Anjuna Beach',
      description: 'Popular beach with trendy cafes and scenic cliffs.',
      address: 'Anjuna, Goa',
      plannedDate: '2026-11-17',
      visitingTime: '04:00 PM',
      notes: 'Expect a lively sunset experience.',
      status: 'Planned',
      coordinates: { lat: 15.5768, lng: 73.7396 },
      photos: 0
    },
    {
      id: 'place-3',
      name: 'Old Goa',
      description: 'Historic churches and architectural landmarks.',
      address: 'Old Goa',
      plannedDate: '2026-11-18',
      visitingTime: '10:30 AM',
      actualVisitDate: '2026-11-18',
      notes: 'Great for heritage photography.',
      status: 'Visited',
      coordinates: { lat: 15.5005, lng: 73.9117 },
      photos: 9
    },
    {
      id: 'place-4',
      name: 'Palolem',
      description: 'One of the prettiest beaches in South Goa.',
      address: 'Palolem, Goa',
      plannedDate: '2026-11-20',
      visitingTime: '12:00 PM',
      notes: 'Good for a relaxed beach day.',
      status: 'Planned',
      coordinates: { lat: 15.0132, lng: 74.0237 },
      photos: 0
    },
    {
      id: 'place-5',
      name: 'Arambol',
      description: 'Chickenshacks and a laid-back vibe with a scenic beach.',
      address: 'Arambol, Goa',
      plannedDate: '2026-11-21',
      visitingTime: '02:00 PM',
      notes: 'Good for last-day wandering.',
      status: 'Skipped',
      coordinates: { lat: 15.706, lng: 73.7007 },
      photos: 2
    }
  ],
  expenses: [
    {
      id: 'expense-1',
      title: 'Flight tickets',
      amount: 32000,
      currency: 'INR',
      date: '2026-11-15',
      category: 'Transport',
      paymentMethod: 'Card',
      destination: 'Bengaluru → Goa',
      payer: 'Sam',
      notes: 'Round trip airfare'
    },
    {
      id: 'expense-2',
      title: 'Beach resort',
      amount: 18000,
      currency: 'INR',
      date: '2026-11-16',
      category: 'Accommodation',
      paymentMethod: 'UPI',
      destination: 'Baga',
      payer: 'Sam',
      notes: '3 nights stay'
    },
    {
      id: 'expense-3',
      title: 'Local transport',
      amount: 4200,
      currency: 'INR',
      date: '2026-11-17',
      category: 'Fuel',
      paymentMethod: 'Cash',
      destination: 'North Goa',
      payer: 'Jia',
      notes: 'Bike rental and fuel'
    }
  ],
  memories: [
    {
      id: 'memory-1',
      title: 'Sunset at Baga',
      description: 'Golden hour and fresh seafood by the shore.',
      date: '2026-11-16',
      time: '06:30 PM',
      location: 'Baga Beach',
      notes: 'Magical sunset with music in the background.',
      mediaCount: 3
    },
    {
      id: 'memory-2',
      title: 'Heritage walk in Old Goa',
      description: 'Beautiful structures and a quiet old-world charm.',
      date: '2026-11-18',
      time: '11:00 AM',
      location: 'Old Goa',
      notes: 'Would revisit for the architecture.',
      mediaCount: 5
    }
  ]
}

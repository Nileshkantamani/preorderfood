// frontend/src/pages/CustomerHomePage.jsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'

import Loader from '../components/Loader'
import Toast from '../components/Toast'

const CustomerHomePage = () => {
  const navigate = useNavigate()
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('all')
  const [sort, setSort] = useState('name-asc')
  const [ratings, setRatings] = useState({})

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const { data } = await api.get('/restaurants')
        setRestaurants(data)
      } catch {
        setError('Failed to load restaurants.')
      } finally {
        setLoading(false)
      }
    }
    fetchRestaurants()
  }, [])

  useEffect(() => {
    const fetchRatings = async () => {
      if (!restaurants.length) return
      try {
        const entries = await Promise.all(
          restaurants.map(async (r) => {
            try {
              const { data } = await api.get(`/customer/restaurants/${r.id}/ratings`)
              return [r.id, data.average_restaurant_rating]
            } catch {
              return [r.id, null]
            }
          })
        )
        setRatings(Object.fromEntries(entries))
      } catch {
        // ignore rating errors; core list should still work
      }
    }
    fetchRatings()
  }, [restaurants])

  const filtered = useMemo(() => {
    let list = [...restaurants]

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (r) =>
          r.restaurant_name.toLowerCase().includes(q) ||
          r.city.toLowerCase().includes(q)
      )
    }
    if (city !== 'all') {
      list = list.filter((r) => (r.city || '').toLowerCase() === city.toLowerCase())
    }
    list.sort((a, b) =>
      sort === 'name-asc'
        ? a.restaurant_name.localeCompare(b.restaurant_name)
        : b.restaurant_name.localeCompare(a.restaurant_name)
    )
    return list
  }, [restaurants, search, city, sort])

  const cities = useMemo(
    () =>
      Array.from(
        new Map(
          restaurants.map((r) => {
            const raw = (r.city || '').trim()
            const key = raw.toLowerCase()
            const title = raw ? raw[0].toUpperCase() + raw.slice(1).toLowerCase() : ''
            return [key, title]
          })
        ).values()
      )
        .filter(Boolean)
        .sort(),
    [restaurants]
  )

  if (loading) return <Loader text="Loading restaurants..." />

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Toast message={error} onClose={() => setError('')} />
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-textPrimary mb-1">
          Choose a Restaurant
        </h1>
        <p className="text-sm text-textSecondary">
          Browse our approved restaurants and place your order.
        </p>
      </header>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or city"
          className="flex-1 px-3 py-2 text-sm border border-border rounded-md bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-md bg-surface"
        >
          <option value="all">All Cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-md bg-surface"
        >
          <option value="name-asc">Name A–Z</option>
          <option value="name-desc">Name Z–A</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-textSecondary">
          <div className="text-4xl mb-2">📭</div>
          <p>No restaurants available yet.</p>
          <p>Check back soon!</p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => {
            const rating = ratings[r.id]

            const computeStatus = () => {
              try {
                if (!r.opening_time || !r.closing_time) return 'CLOSED'
                const now = new Date()
                const [oh, om] = r.opening_time.split(':').map((x) => parseInt(x, 10))
                const [ch, cm] = r.closing_time.split(':').map((x) => parseInt(x, 10))
                const nowMinutes = now.getHours() * 60 + now.getMinutes()
                const openMinutes = oh * 60 + om
                const closeMinutes = ch * 60 + cm
                return nowMinutes >= openMinutes && nowMinutes <= closeMinutes ? 'OPEN' : 'CLOSED'
              } catch {
                return 'CLOSED'
              }
            }

            const status = computeStatus()

            return (
              <div
                key={r.id}
                className="bg-surface border border-border rounded-lg p-6 shadow-sm hover:shadow-md hover:border-primary transition cursor-pointer flex flex-col justify-between"
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-textPrimary">
                    {r.restaurant_name}
                  </h3>
                  <p className="text-xs text-textSecondary">
                    {(r.city || '').charAt(0).toUpperCase() + (r.city || '').slice(1).toLowerCase()}
                  </p>
                  <p className="text-xs text-textSecondary mt-1 overflow-hidden text-ellipsis">
                    {r.address}
                  </p>
                  <p className="text-xs text-textSecondary mt-1">
                    ⭐ Rating: {typeof rating === 'number' && rating > 0 ? rating.toFixed(1) : '—'}
                  </p>
                  <p className="text-xs text-textSecondary mt-1">
                    Hours: {r.opening_time} – {r.closing_time}
                  </p>
                  <span
                    className={`inline-block mt-2 px-2 py-0.5 text-[10px] rounded-full font-medium ${
                      status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {status === 'OPEN' ? 'Open' : 'Closed'}
                  </span>
                </div>
                <div className="mt-auto flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
                  {(() => {
                    const baseQuery = `${r.restaurant_name || ''} ${r.city || ''}`.trim()
                    const fallbackUrl =
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(baseQuery)}`
                    const href = (r.maps_link || '').trim() || fallbackUrl
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 text-xs font-medium rounded-md border border-border text-textSecondary hover:bg-slate-50 flex items-center justify-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span>📍</span>
                        <span>View on Map</span>
                      </a>
                    )
                  })()}
                  <button
                    onClick={() => {
                      const role = localStorage.getItem('auth_role')
                      if (role === 'customer') {
                        navigate(`/customer/restaurant/${r.id}`)
                      } else {
                        navigate('/login')
                      }
                    }}
                    className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-white hover:bg-primary/90"
                  >
                    View Menu
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default CustomerHomePage
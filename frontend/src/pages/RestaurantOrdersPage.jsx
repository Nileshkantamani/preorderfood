import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import Loader from '../components/Loader'
import Toast from '../components/Toast'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Card from '../components/Card'

const statusVariant = (status) => {
  switch (status) {
    case 'ACCEPTED':
      return 'success'
    case 'REJECTED':
      return 'danger'
    case 'COMPLETED':
      return 'default'
    case 'PENDING':
    default:
      return 'warning'
  }
}

const RestaurantOrdersPage = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL') // ALL | ACCEPTED | REJECTED | COMPLETED
  const [search, setSearch] = useState('')

  useEffect(() => {
    const role = localStorage.getItem('auth_role')
    if (role !== 'restaurant') {
      navigate('/login')
      return
    }

    const fetchData = async () => {
      try {
        const profileRes = await api.get('/restaurant/profile')
        const profile = profileRes.data
        if (profile.status === 'PENDING') {
          navigate('/restaurant/pending')
          return
        }
        if (profile.status === 'REJECTED') {
          navigate('/restaurant/rejected')
          return
        }

        const { data } = await api.get('/restaurant/orders')
        setOrders(data)
      } catch (err) {
        if (err.response?.status === 403) {
          navigate('/restaurant/pending')
        } else {
          setError('Failed to load orders.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [navigate])

  const filteredOrders = useMemo(() => {
    let list = orders.filter((o) => o.status !== 'PENDING')

    if (statusFilter !== 'ALL') {
      list = list.filter((o) => o.status === statusFilter)
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (o) =>
          o.customer_name.toLowerCase().includes(q) ||
          String(o.order_id).includes(q),
      )
    }

    return list
  }, [orders, statusFilter, search])

  if (loading) return <Loader text="Loading orders..." />

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Toast message={error} onClose={() => setError('')} />

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-textPrimary mb-1">
            Order History
          </h1>
          <p className="text-sm text-textSecondary">
            View all past orders from your customers.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4 text-xs">
        <div className="flex items-center gap-1">
          <span className="text-textSecondary">Status:</span>
          <select
            className="border border-border rounded-md px-2 py-1 bg-surface text-xs"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Rejected</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        <div className="flex-1 min-w-[180px] max-w-xs">
          <input
            type="text"
            placeholder="Search by customer or order ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-border rounded-md px-3 py-1.5 text-xs bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="py-12 text-center text-sm text-textSecondary">
          <div className="text-4xl mb-2">📜</div>
          <p>No orders yet.</p>
          <p>Orders will appear here once customers start ordering.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((o) => (
            <Card key={o.order_id} className="rounded-md">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-textPrimary">
                    Order #{o.order_id}
                  </p>
                  <p className="text-[11px] text-textSecondary">
                    Customer: {o.customer_name}
                  </p>
                </div>
                <Badge
                  variant={statusVariant(o.status)}
                  className="text-[10px] px-2 py-1 font-medium"
                >
                  {o.status}
                </Badge>
              </div>
              <div className="text-xs text-textSecondary mb-2">
                <p>
                  Arrival:{' '}
                  <span className="font-medium">
                    {new Date(o.arrival_time).toLocaleString()}
                  </span>
                </p>
                <p>People: {o.people}</p>
                <p className="mt-1">
                  <span className="font-medium text-textPrimary">Items:</span>{' '}
                  {o.items
                    .map((it) => `${it.item_name} (x${it.quantity})`)
                    .join(', ')}
                </p>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-textSecondary">
                <span className="font-semibold text-textPrimary">
                  Total: ₹{o.total}
                </span>
                <Button
                  variant="secondary"
                  className="px-3 py-1 text-xs font-medium"
                  onClick={() => navigate(`/restaurant/order/${o.order_id}`)}
                >
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default RestaurantOrdersPage

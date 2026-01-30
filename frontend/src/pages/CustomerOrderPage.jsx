// frontend/src/pages/CustomerOrdersPage.jsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../utils/api'
import Loader from '../components/Loader'
import Toast from '../components/Toast'
import FeedbackModal from '../components/FeedbackModal'

const statusColor = (status) => {
  switch (status) {
    case 'PENDING':
      return 'bg-amber-100 text-amber-800'
    case 'ACCEPTED':
      return 'bg-emerald-100 text-emerald-800'
    case 'REJECTED':
      return 'bg-red-100 text-red-700'
    case 'COMPLETED':
      return 'bg-slate-100 text-slate-800'
    default:
      return 'bg-slate-100 text-slate-800'
  }
}

const CustomerOrdersPage = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [feedbackOrderId, setFeedbackOrderId] = useState(null)
  const [feedbackMode, setFeedbackMode] = useState('create') // 'create' | 'view'
  const [feedbackInitial, setFeedbackInitial] = useState(null)

  useEffect(() => {
    const role = localStorage.getItem('auth_role')
    if (role !== 'customer') {
      navigate('/login')
      return
    }
    const fetchOrders = async () => {
      try {
        const { data } = await api.get('/customer/orders')
        setOrders(data)
      } catch {
        setError('Failed to load orders.')
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [navigate])

  const openGiveFeedback = async (orderId) => {
    setFeedbackOrderId(orderId)
    setFeedbackMode('create')
    setFeedbackInitial(null)
  }

  const openViewFeedback = async (orderId) => {
    try {
      const { data } = await api.get(`/customer/orders/${orderId}/feedback`)
      setFeedbackInitial(data)
      setFeedbackOrderId(orderId)
      setFeedbackMode('view')
    } catch (err) {
      setError('Failed to load feedback.')
    }
  }

  const closeFeedback = () => {
    setFeedbackOrderId(null)
    setFeedbackMode('create')
    setFeedbackInitial(null)
  }

  const handleSubmitFeedback = async (payload) => {
    if (!feedbackOrderId) return
    try {
      await api.post(`/customer/orders/${feedbackOrderId}/feedback`, payload)
      // Update local state flags for this order
      setOrders((prev) =>
        prev.map((o) =>
          o.order_id === feedbackOrderId
            ? { ...o, has_feedback: true, can_give_feedback: false }
            : o
        )
      )
      closeFeedback()
    } catch (err) {
      const status = err.response?.status
      const detail = err.response?.data?.detail
      if (status === 400 && typeof detail === 'string') {
        setError(detail)
      } else {
        setError('Failed to submit feedback.')
      }
    }
  }

  const filtered = useMemo(() => {
    let list = [...orders]

    // If we're on the detail route (/customer/order/:id), only show that order.
    if (id) {
      list = list.filter((o) => String(o.order_id) === String(id))
      return list
    }

    if (statusFilter !== 'all') {
      list = list.filter((o) => o.status === statusFilter)
    }
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((o) =>
        o.restaurant_name.toLowerCase().includes(q)
      )
    }
    return list
  }, [orders, statusFilter, search, id])

  if (loading) return <Loader text="Loading orders..." />

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Toast message={error} onClose={() => setError('')} />
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-textPrimary mb-1">
          My Orders
        </h1>
        <p className="text-sm text-textSecondary">
          Track all your orders.
        </p>
      </header>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-md bg-surface"
        >
          <option value="all">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="REJECTED">Rejected</option>
          <option value="COMPLETED">Completed</option>
        </select>
        {/* Date filter omitted for now as backend does not support it yet */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by restaurant name"
          className="flex-1 px-3 py-2 text-sm border border-border rounded-md bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-textSecondary">
          <div className="text-4xl mb-2">📋</div>
          <p>No orders yet.</p>
          <p>Start ordering from your favorite restaurants!</p>
          <button
            onClick={() => navigate('/customer/home')}
            className="mt-4 px-4 py-2 text-sm font-medium rounded-md bg-primary text-white hover:bg-primary/90"
          >
            Browse Restaurants
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((o) => (
            <div
              key={o.order_id}
              className="bg-surface border border-border rounded-md p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-textPrimary">
                    Order #{o.order_id}
                  </p>
                </div>
                <span
                  className={`text-[10px] px-2 py-1 rounded-full font-medium ${statusColor(
                    o.status
                  )}`}
                >
                  {o.status}
                </span>
              </div>
              <div className="text-xs text-textSecondary mb-2">
                <p>Restaurant: {o.restaurant_name}</p>
              </div>
              <div className="text-xs text-textSecondary mb-2">
                <p className="font-medium text-textPrimary mb-1">Items:</p>
                <ul className="space-y-0.5">
                  {o.items.map((it, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span>
                        {it.item_name} (x{it.quantity})
                      </span>
                      <span>₹{it.price * it.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-textSecondary">
                <span className="font-semibold text-textPrimary">
                  Total: ₹{o.total}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/customer/order/${o.order_id}`)}
                    className="px-3 py-1 text-xs font-medium rounded-md border border-border text-textSecondary hover:bg-slate-50"
                  >
                    View Details
                  </button>
                  {o.can_give_feedback && (
                    <button
                      onClick={() => openGiveFeedback(o.order_id)}
                      className="px-3 py-1 text-xs font-medium rounded-md border border-border text-textSecondary hover:bg-slate-50"
                    >
                      Give Feedback
                    </button>
                  )}
                  {!o.can_give_feedback && o.has_feedback && (
                    <button
                      onClick={() => openViewFeedback(o.order_id)}
                      className="px-3 py-1 text-xs font-medium rounded-md border border-border text-textSecondary hover:bg-slate-50"
                    >
                      View Feedback
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <FeedbackModal
        open={Boolean(feedbackOrderId)}
        onClose={closeFeedback}
        onSubmit={handleSubmitFeedback}
        initialValue={feedbackInitial}
        readOnly={feedbackMode === 'view'}
      />
    </div>
  )
}

export default CustomerOrdersPage
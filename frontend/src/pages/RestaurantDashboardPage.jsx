// frontend/src/pages/RestaurantDashboardPage.jsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import Loader from '../components/Loader'
import Toast from '../components/Toast'

const statusColor = (status) => {
  switch (status) {
    case 'ACCEPTED':
      return 'bg-emerald-100 text-emerald-800'
    case 'REJECTED':
      return 'bg-red-100 text-red-700'
    case 'COMPLETED':
      return 'bg-slate-100 text-slate-800'
    case 'PENDING':
    default:
      return 'bg-amber-100 text-amber-800'
  }
}

const RestaurantDashboardPage = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('incoming') // incoming | history

  // accept modal
  const [accepting, setAccepting] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const role = localStorage.getItem('auth_role')
    if (role !== 'restaurant') {
      navigate('/login')
      return
    }

    const fetchData = async () => {
      try {
        // First check profile status
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

        // Only APPROVED reaches here; fetch orders
        const { data } = await api.get('/restaurant/orders')
        setOrders(data)
      } catch (err) {
        if (err.response?.status === 403) {
          // Not approved
          navigate('/restaurant/pending')
        } else {
          setError('Failed to load orders.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 30000) // auto-refresh every 30s
    return () => clearInterval(interval)
  }, [navigate])

  const pendingOrders = useMemo(
    () => orders.filter((o) => o.status === 'PENDING'),
    [orders]
  )

  const historyOrders = useMemo(
    () => orders.filter((o) => o.status !== 'PENDING'),
    [orders]
  )

  const handleOpenAccept = (order) => {
    setSelectedOrder(order)
    setAccepting(true)
    setRejecting(false)
    setRejectReason('')
  }

  const handleOpenReject = (order) => {
    setSelectedOrder(order)
    setRejecting(true)
    setAccepting(false)
    setRejectReason('')
  }

  const closeModals = () => {
    setSelectedOrder(null)
    setAccepting(false)
    setRejecting(false)
    setRejectReason('')
    setSubmitting(false)
  }

  const handleConfirmAccept = async () => {
    if (!selectedOrder) return
    setSubmitting(true)
    try {
      await api.post(`/restaurant/order/${selectedOrder.order_id}/accept`)
      // Update local state: move order to history as ACCEPTED
      setOrders((prev) =>
        prev.map((o) =>
          o.order_id === selectedOrder.order_id ? { ...o, status: 'ACCEPTED' } : o
        )
      )
      closeModals()
      setError('') // clear error; Toast is reused for success/error only
    } catch {
      setError('Failed to accept order.')
      setSubmitting(false)
    }
  }

  const handleConfirmReject = async () => {
    if (!selectedOrder) return
    if (!rejectReason || rejectReason.trim().length < 10) {
      setError('Please provide a rejection reason (min 10 characters).')
      return
    }
    setSubmitting(true)
    try {
      await api.post(`/restaurant/order/${selectedOrder.order_id}/reject`, {
        reason: rejectReason,
      })
      // Update local state: move order to history as REJECTED
      setOrders((prev) =>
        prev.map((o) =>
          o.order_id === selectedOrder.order_id ? { ...o, status: 'REJECTED' } : o
        )
      )
      closeModals()
      setError('')
    } catch {
      setError('Failed to reject order.')
      setSubmitting(false)
    }
  }

  if (loading) return <Loader text="Loading dashboard..." />

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Toast message={error} onClose={() => setError('')} />

      {/* Tabs + heading */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-textPrimary mb-1">
            Restaurant Dashboard
          </h1>
          <p className="text-sm text-textSecondary">
            Manage incoming orders and view your order history.
          </p>
        </div>
      </div>

      <div className="border-b border-border mb-4 flex gap-4 text-sm">
        <button
          className={`pb-2 ${
            activeTab === 'incoming'
              ? 'border-b-2 border-primary text-textPrimary font-medium'
              : 'text-textSecondary'
          }`}
          onClick={() => setActiveTab('incoming')}
        >
          Incoming Orders ({pendingOrders.length})
        </button>
        <button
          className={`pb-2 ${
            activeTab === 'history'
              ? 'border-b-2 border-primary text-textPrimary font-medium'
              : 'text-textSecondary'
          }`}
          onClick={() => setActiveTab('history')}
        >
          Order History
        </button>
      </div>

      {/* Incoming Orders */}
      {activeTab === 'incoming' && (
        <div>
          {pendingOrders.length === 0 ? (
            <div className="py-12 text-center text-sm text-textSecondary">
              <div className="text-4xl mb-2">📥</div>
              <p>No pending orders</p>
              <p>New orders will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingOrders.map((o) => (
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
                    <span className="text-[10px] px-2 py-1 rounded-full font-medium bg-amber-100 text-amber-800">
                      PENDING
                    </span>
                  </div>
                  <div className="text-xs text-textSecondary mb-2">
                    <p>Customer: {o.customer_name}</p>
                    <p>
                      Arrival:{' '}
                      <span className="font-medium">
                        {new Date(o.arrival_time).toLocaleString()}
                      </span>
                    </p>
                    <p>People: {o.people}</p>
                  </div>
                  <div className="text-xs text-textSecondary mb-2">
                    <p className="font-medium text-textPrimary mb-1">
                      Items Ordered:
                    </p>
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
                      Total Amount: ₹{o.total}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenReject(o)}
                        className="px-3 py-1 text-xs font-medium rounded-md border border-red-500 text-red-600 hover:bg-red-50"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleOpenAccept(o)}
                        className="px-3 py-1 text-xs font-medium rounded-md bg-primary text-white hover:bg-primary/90"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Order History */}
      {activeTab === 'history' && (
        <div>
          {historyOrders.length === 0 ? (
            <div className="py-12 text-center text-sm text-textSecondary">
              <div className="text-4xl mb-2">📜</div>
              <p>No orders yet.</p>
              <p>Orders will appear here once customers start ordering.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {historyOrders.map((o) => (
                <div
                  key={o.order_id}
                  className="bg-surface border border-border rounded-md p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-textPrimary">
                        Order #{o.order_id}
                      </p>
                      <p className="text-[11px] text-textSecondary">
                        Customer: {o.customer_name}
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
                    <p>
                      Arrival:{' '}
                      <span className="font-medium">
                        {new Date(o.arrival_time).toLocaleString()}
                      </span>
                    </p>
                    <p>People: {o.people}</p>
                    <p className="mt-1">
                      <span className="font-medium text-textPrimary">
                        Items:
                      </span>{' '}
                      {o.items
                        .map((it) => `${it.item_name} (x${it.quantity})`)
                        .join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-textSecondary">
                    <span className="font-semibold text-textPrimary">
                      Total: ₹{o.total}
                    </span>
                    <button
                      onClick={() =>
                        navigate(`/restaurant/order/${o.order_id}`)
                      }
                      className="px-3 py-1 text-xs font-medium rounded-md border border-border text-textSecondary hover:bg-slate-50"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Accept modal */}
      {accepting && selectedOrder && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-40">
          <div className="bg-surface border border-border rounded-md p-5 max-w-sm w-full">
            <h2 className="text-sm font-semibold text-textPrimary mb-2">
              Accept this order?
            </h2>
            <p className="text-xs text-textSecondary mb-3">
              Order #{selectedOrder.order_id} • {selectedOrder.customer_name}
            </p>
            <p className="text-xs text-textSecondary mb-1">
              Arrival:{' '}
              {new Date(selectedOrder.arrival_time).toLocaleString()}
            </p>
            <p className="text-xs text-textSecondary mb-3">
              Total: ₹{selectedOrder.total}
            </p>
            <div className="flex justify-end gap-2 mt-2 text-xs">
              <button
                onClick={closeModals}
                className="px-3 py-1 rounded-md border border-border text-textSecondary hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAccept}
                disabled={submitting}
                className="px-3 py-1 rounded-md bg-primary text-white hover:bg-primary/90 disabled:opacity-60"
              >
                {submitting ? 'Accepting...' : 'Confirm Accept'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejecting && selectedOrder && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-40">
          <div className="bg-surface border border-border rounded-md p-5 max-w-sm w-full">
            <h2 className="text-sm font-semibold text-textPrimary mb-2">
              Reject this order?
            </h2>
            <p className="text-xs text-textSecondary mb-3">
              Order #{selectedOrder.order_id} • {selectedOrder.customer_name}
            </p>
            <label className="block text-[11px] text-textSecondary mb-1">
              Reason for rejection (min 10 characters)
            </label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-border rounded-md bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex justify-end gap-2 mt-2 text-xs">
              <button
                onClick={closeModals}
                className="px-3 py-1 rounded-md border border-border text-textSecondary hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={submitting}
                className="px-3 py-1 rounded-md border border-red-500 text-red-600 hover:bg-red-50 disabled:opacity-60"
              >
                {submitting ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RestaurantDashboardPage
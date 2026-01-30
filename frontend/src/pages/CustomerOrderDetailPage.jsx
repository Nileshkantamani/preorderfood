import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../utils/api'
import Loader from '../components/Loader'
import Toast from '../components/Toast'
import StarRating from '../components/StarRating'
import FeedbackModal from '../components/FeedbackModal'

const CustomerOrderDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackMode, setFeedbackMode] = useState('create')

  useEffect(() => {
    const role = localStorage.getItem('auth_role')
    if (role !== 'customer') {
      navigate('/login')
      return
    }

    const fetchOrder = async () => {
      try {
        const { data } = await api.get(`/orders/${id}`)
        setOrder(data)
        // Try to load feedback, ignore 404
        try {
          const fbRes = await api.get(`/customer/orders/${id}/feedback`)
          setFeedback(fbRes.data)
        } catch (err) {
          if (err.response?.status !== 404) {
            console.error('Failed to load feedback for order detail', err)
          }
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setError('Order not found.')
        } else {
          setError('Failed to load order.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [id, navigate])

  const handleBack = () => {
    navigate('/customer/orders')
  }

  const canGiveFeedback = () => {
    if (!order) return false
    const arrival = order.arrival_time ? new Date(order.arrival_time) : null
    if (!arrival) return false
    const now = new Date()
    return now > arrival && !feedback
  }

  const openGiveFeedback = () => {
    setFeedbackMode('create')
    setFeedbackOpen(true)
  }

  const openViewFeedback = () => {
    setFeedbackMode('view')
    setFeedbackOpen(true)
  }

  const closeFeedback = () => {
    setFeedbackOpen(false)
  }

  const handleSubmitFeedback = async (payload) => {
    try {
      const { data } = await api.post(`/customer/orders/${id}/feedback`, payload)
      setFeedback(data)
      setFeedbackMode('view')
      setFeedbackOpen(false)
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

  if (loading) return <Loader text="Loading order..." />

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center text-sm text-textSecondary">
        <Toast message={error} onClose={() => setError('')} />
        <p className="mb-4">{error || 'Order not found.'}</p>
        <button
          type="button"
          onClick={handleBack}
          className="px-4 py-2 text-sm font-medium rounded-md border border-border text-textSecondary hover:bg-slate-50"
        >
          Back to Orders
        </button>
      </div>
    )
  }

  const subtotal = order.total_amount ?? order.total
  const tax = Math.round(subtotal * 0.05)
  const totalWithTax = subtotal + tax

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Toast message={error} onClose={() => setError('')} />
      <div className="bg-surface border border-border rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold text-textPrimary">Order Details</h1>
          <span className="text-[11px] px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 font-medium">
            {order.status}
          </span>
        </div>

        <div className="text-xs text-textSecondary mb-3">
          <p>
            <span className="font-medium text-textPrimary">Order ID:</span> #{order.id}
          </p>
          {order.created_at && (
            <p>
              <span className="font-medium text-textPrimary">Placed on:</span>{' '}
              {new Date(order.created_at).toLocaleString()}
            </p>
          )}
        </div>

        <div className="border-t border-border pt-3 mt-3 mb-3">
          <p className="text-xs font-semibold text-textPrimary mb-1">Restaurant</p>
          <p className="text-xs text-textSecondary">{order.restaurant?.restaurant_name}</p>
          <p className="text-xs text-textSecondary">City: {order.restaurant?.city}</p>
        </div>

        <div className="border-t border-border pt-3 mt-3 mb-3">
          <p className="text-xs font-semibold text-textPrimary mb-1">Order Information</p>
          {order.arrival_time && (
            <p className="text-xs text-textSecondary">
              Arrival Time: {new Date(order.arrival_time).toLocaleString()}
            </p>
          )}
          <p className="text-xs text-textSecondary">
            Number of People: {order.number_of_people ?? order.number_of_people ?? order.people}
          </p>
        </div>

        <div className="border-t border-border pt-3 mt-3 mb-3">
          <p className="text-xs font-semibold text-textPrimary mb-2">Items Ordered</p>
          <div className="space-y-2">
            {order.items?.map((it, idx) => (
              <div key={idx} className="flex justify-between text-xs text-textSecondary">
                <div>
                  <p className="font-medium text-textPrimary">{it.item_name}</p>
                  <p>
                    Quantity: {it.quantity} • Price: ₹{it.price} each = ₹
                    {it.price * it.quantity}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-3 mt-3 mb-4">
          <p className="text-xs font-semibold text-textPrimary mb-1">Payment Information</p>
          <p className="text-xs text-textSecondary">Subtotal: ₹{subtotal}</p>
          <p className="text-xs text-textSecondary">Tax (5%): ₹{tax}</p>
          <p className="text-xs text-textSecondary font-semibold text-textPrimary">
            Total: ₹{totalWithTax}
          </p>
          <p className="text-xs text-textSecondary">Payment Method: Pay on Arrival</p>
          {order.payment_status && (
            <p className="text-xs text-textSecondary">Payment Status: {order.payment_status}</p>
          )}
        </div>

        <div className="border-t border-border pt-3 mt-3 mb-4">
          <p className="text-xs font-semibold text-textPrimary mb-2">Feedback</p>
          {feedback ? (
            <div className="space-y-1 text-xs text-textSecondary">
              <div className="flex items-center gap-2">
                <span className="font-medium text-textPrimary">Restaurant:</span>
                <StarRating value={feedback.restaurant_rating} readOnly size={14} />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-textPrimary">Food:</span>
                <StarRating value={feedback.food_rating} readOnly size={14} />
              </div>
              {feedback.comment && <p className="mt-1">“{feedback.comment}”</p>}

              <button
                type="button"
                onClick={openViewFeedback}
                className="mt-2 px-3 py-1 text-xs font-medium rounded-md border border-border text-textSecondary hover:bg-slate-50"
              >
                View Feedback
              </button>
            </div>
          ) : canGiveFeedback() ? (
            <button
              type="button"
              onClick={openGiveFeedback}
              className="px-3 py-1 text-xs font-medium rounded-md border border-border text-textSecondary hover:bg-slate-50"
            >
              Give Feedback
            </button>
          ) : (
            <p className="text-xs text-textSecondary">
              Feedback will be available after your visit.
            </p>
          )}
        </div>

        <div className="flex justify-start mt-2">
          <button
            type="button"
            onClick={handleBack}
            className="px-4 py-2 text-sm font-medium rounded-md border border-border text-textSecondary hover:bg-slate-50"
          >
            Back to Orders
          </button>
        </div>
      </div>
    </div>
  )
}

export default CustomerOrderDetailPage

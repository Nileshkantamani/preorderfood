import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../utils/api'
import Loader from '../components/Loader'
import Toast from '../components/Toast'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Card from '../components/Card'
import Modal from '../components/Modal'

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

const RestaurantOrderPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [accepting, setAccepting] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const role = localStorage.getItem('auth_role')
    if (role !== 'restaurant') {
      navigate('/login')
      return
    }

    const fetchOrder = async () => {
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

        const { data } = await api.get(`/restaurant/order/${id}`)
        setOrder(data)
      } catch (err) {
        if (err.response?.status === 404) {
          setError('Order not found.')
        } else if (err.response?.status === 403) {
          navigate('/restaurant/pending')
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
    navigate('/restaurant/orders')
  }

  const openAccept = () => {
    setAccepting(true)
    setRejecting(false)
    setRejectReason('')
  }

  const openReject = () => {
    setRejecting(true)
    setAccepting(false)
    setRejectReason('')
  }

  const closeModals = () => {
    setAccepting(false)
    setRejecting(false)
    setRejectReason('')
    setSubmitting(false)
  }

  const handleConfirmAccept = async () => {
    if (!order) return
    setSubmitting(true)
    try {
      await api.post(`/restaurant/order/${order.order_id}/accept`)
      setOrder((prev) => (prev ? { ...prev, status: 'ACCEPTED' } : prev))
      closeModals()
      setError('')
    } catch {
      setError('Failed to accept order.')
      setSubmitting(false)
    }
  }

  const handleConfirmReject = async () => {
    if (!order) return
    if (!rejectReason || rejectReason.trim().length < 10) {
      setError('Please provide a rejection reason (min 10 characters).')
      return
    }
    setSubmitting(true)
    try {
      await api.post(`/restaurant/order/${order.order_id}/reject`, {
        reason: rejectReason,
      })
      setOrder((prev) => (prev ? { ...prev, status: 'REJECTED' } : prev))
      closeModals()
      setError('')
    } catch {
      setError('Failed to reject order.')
      setSubmitting(false)
    }
  }

  if (loading) return <Loader text="Loading order..." />

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center text-sm text-textSecondary">
        <Toast message={error} onClose={() => setError('')} />
        <p className="mb-4">{error || 'Order not found.'}</p>
        <Button variant="secondary" onClick={handleBack}>
          Back to Orders
        </Button>
      </div>
    )
  }

  const canAct = order.status === 'PENDING'

  const subtotal = order.total
  const tax = Math.round(subtotal * 0.05)
  const totalWithTax = subtotal + tax

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Toast message={error} onClose={() => setError('')} />
      <Card className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold text-textPrimary">Order Details</h1>
          <Badge variant={statusVariant(order.status)} className="text-[11px] px-2 py-1 font-medium">
            {order.status}
          </Badge>
        </div>

        <div className="text-xs text-textSecondary mb-3">
          <p>
            <span className="font-medium text-textPrimary">Order ID:</span>{' '}
            #{order.order_id}
          </p>
          <p>
            <span className="font-medium text-textPrimary">Placed on:</span>{' '}
            {new Date(order.created_at).toLocaleString()}
          </p>
        </div>

        <div className="border-t border-border pt-3 mt-3 mb-3">
          <p className="text-xs font-semibold text-textPrimary mb-1">
            Customer Information
          </p>
          <p className="text-xs text-textSecondary">
            Name: {order.customer_name}
          </p>
          <p className="text-xs text-textSecondary">
            Phone: {order.customer_phone}
          </p>
        </div>

        <div className="border-t border-border pt-3 mt-3 mb-3">
          <p className="text-xs font-semibold text-textPrimary mb-1">
            Order Information
          </p>
          <p className="text-xs text-textSecondary">
            Arrival Time:{' '}
            {new Date(order.arrival_time).toLocaleString()}
          </p>
          <p className="text-xs text-textSecondary">
            Number of People: {order.people}
          </p>
        </div>

        <div className="border-t border-border pt-3 mt-3 mb-3">
          <p className="text-xs font-semibold text-textPrimary mb-2">
            Items Ordered
          </p>
          <div className="space-y-2">
            {order.items.map((it, idx) => (
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

        <div className="border-t border-border pt-3 mt-3 mb-3">
          <p className="text-xs font-semibold text-textPrimary mb-1">
            Payment Information
          </p>
          <p className="text-xs text-textSecondary">Subtotal: ₹{subtotal}</p>
          <p className="text-xs text-textSecondary">Tax (5%): ₹{tax}</p>
          <p className="text-xs text-textSecondary font-semibold text-textPrimary">
            Total: ₹{totalWithTax}
          </p>
          <p className="text-xs text-textSecondary">
            Payment Method: Pay on Arrival
          </p>
          <p className="text-xs text-textSecondary">
            Payment Status: {order.payment_status}
          </p>
        </div>

        {/* Status-specific message */}
        <div className="text-[11px] text-textSecondary mb-4">
          {order.status === 'ACCEPTED' && (
            <p>
              You accepted this order.
            </p>
          )}
          {order.status === 'REJECTED' && (
            <p>
              You rejected this order.
            </p>
          )}
          {order.status === 'COMPLETED' && (
            <p>This order was completed.</p>
          )}
        </div>

        <div className="flex justify-between items-center mt-4">
          <Button variant="secondary" onClick={handleBack}>
            Back to Orders
          </Button>

          {canAct && (
            <div className="flex gap-2">
              <Button variant="danger" className="px-3 py-1 text-xs" onClick={openReject}>
                Reject Order
              </Button>
              <Button className="px-3 py-1 text-xs" onClick={openAccept}>
                Accept Order
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Accept modal */}
      <Modal
        open={accepting}
        title="Accept this order?"
        onClose={closeModals}
        footer={
          <>
            <Button variant="secondary" onClick={closeModals}>
              Cancel
            </Button>
            <Button onClick={handleConfirmAccept} disabled={submitting}>
              {submitting ? 'Accepting...' : 'Confirm Accept'}
            </Button>
          </>
        }
      >
        <p className="mb-2">
          Order #{order.order_id} • {order.customer_name}
        </p>
        <p className="mb-1">
          Arrival: {new Date(order.arrival_time).toLocaleString()}
        </p>
        <p>Total: ₹{order.total}</p>
      </Modal>

      {/* Reject modal */}
      <Modal
        open={rejecting}
        title="Reject this order?"
        onClose={closeModals}
        footer={
          <>
            <Button variant="secondary" onClick={closeModals}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmReject}
              disabled={submitting}
            >
              {submitting ? 'Rejecting...' : 'Confirm Reject'}
            </Button>
          </>
        }
      >
        <p className="mb-2">
          Order #{order.order_id} • {order.customer_name}
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
      </Modal>
    </div>
  )
}

export default RestaurantOrderPage

// frontend/src/pages/CustomerPaymentPage.jsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../utils/api'
import Loader from '../components/Loader'
import Toast from '../components/Toast'

const CustomerPaymentPage = () => {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [method, setMethod] = useState('pay_on_arrival')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const role = localStorage.getItem('auth_role')
    if (role !== 'customer') {
      navigate('/login')
      return
    }

    const fetchOrder = async () => {
      try {
        const { data } = await api.get(`/orders/${orderId}`)
        setOrder(data)
      } catch {
        // If order not found, go back to orders
        navigate('/customer/orders')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId, navigate])

  const handlePayment = async () => {
    if (!order) return
    setProcessing(true)
    setError('')
    try {
      const { data } = await api.post('/payment', {
        order_id: order.id || orderId,
        amount: order.total_amount,
        method,
      })
      if (data.status === 'success') {
        // Mock payment success
        navigate('/customer/orders')
      } else {
        setError('Payment failed. Please try again.')
      }
    } catch {
      setError('Payment failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return <Loader text="Loading order..." />

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <Toast message={error} onClose={() => setError('')} />
        <p className="text-sm text-red-500">Order not found.</p>
      </div>
    )
  }

  const restaurantName = order.restaurant?.restaurant_name || 'Restaurant'
  const arrival = order.arrival_time
    ? new Date(order.arrival_time).toLocaleString()
    : ''
  const items = order.items || []

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <Toast message={error} onClose={() => setError('')} />
      <div className="bg-surface border border-border rounded-md p-6 space-y-4">
        <header>
          <h1 className="text-xl font-semibold text-textPrimary mb-1">
            Payment
          </h1>
          <p className="text-xs text-textSecondary">
            Order #{order.id} – {restaurantName}
          </p>
        </header>

        <div className="border border-border rounded-md p-4 text-xs text-textSecondary space-y-1">
          <p>
            <span className="font-medium">Arrival:</span> {arrival}
          </p>
          <p>
            <span className="font-medium">People:</span>{' '}
            {order.number_of_people}
          </p>
          <p className="mt-2 font-medium text-textPrimary">Items:</p>
          <ul className="space-y-0.5">
            {items.map((it, idx) => (
              <li key={idx} className="flex justify-between">
                <span>
                  {it.item_name} (x{it.quantity})
                </span>
                <span>₹{it.price * it.quantity}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-border pt-2 mt-2 flex justify-between font-semibold text-textPrimary">
            <span>Total Amount</span>
            <span>₹{order.total_amount}</span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-textPrimary">
            Payment Method
          </p>
          <label className="flex items-center gap-2 text-xs text-textSecondary">
            <input
              type="radio"
              name="method"
              value="pay_on_arrival"
              checked={method === 'pay_on_arrival'}
              onChange={(e) => setMethod(e.target.value)}
            />
            <span>Pay on Arrival (Mock)</span>
          </label>
          <label className="flex items-center gap-2 text-xs text-textSecondary opacity-60">
            <input type="radio" disabled />
            <span>Credit/Debit Card (Coming soon)</span>
          </label>
        </div>

        <button
          disabled={processing}
          onClick={handlePayment}
          className="w-full mt-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-white hover:bg-primary/90 disabled:opacity-60"
        >
          {processing ? 'Processing...' : 'Complete Payment'}
        </button>
      </div>
    </div>
  )
}

export default CustomerPaymentPage
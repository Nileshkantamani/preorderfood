import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../utils/api'

const AdminRestaurantPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [restaurant, setRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const role = localStorage.getItem('auth_role')
    if (role !== 'admin') {
      navigate('/admin/login')
      return
    }
    const fetchDetail = async () => {
      try {
        const { data } = await api.get(`/admin/restaurants/${id}`)
        setRestaurant(data)
      } catch (err) {
        setError('Failed to load restaurant details.')
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [id, navigate])

  const handleApprove = async () => {
    setSubmitting(true)
    try {
      await api.post(`/admin/approve/${id}`)
      navigate('/admin/dashboard')
    } catch (err) {
      setError('Failed to approve restaurant.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!rejectReason || rejectReason.trim().length < 3) {
      setError('Please provide a short reason for rejection.')
      return
    }
    setSubmitting(true)
    try {
      await api.post(`/admin/reject/${id}`, { reason: rejectReason })
      navigate('/admin/dashboard')
    } catch (err) {
      setError('Failed to reject restaurant.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-sm text-textSecondary">Loading restaurant...</p>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-sm text-red-500">Restaurant not found.</p>
      </div>
    )
  }

  const { restaurant_name, business_phone, address, city, state, pincode, opening_time, closing_time, menu, status } =
    restaurant

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-textPrimary">{restaurant_name}</h1>
          <p className="text-xs text-textSecondary">
            {city}, {state} • {business_phone}
          </p>
          <p className="text-xs text-textSecondary mt-1">
            {address}, {pincode}
          </p>
          <p className="text-xs text-textSecondary mt-1">
            Hours: {opening_time} – {closing_time}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-textSecondary uppercase">Status</p>
          <p className="text-sm font-medium">{status}</p>
        </div>
      </div>

      <div className="border border-border rounded-md bg-surface p-4">
        <h2 className="text-sm font-semibold text-textPrimary mb-2">Menu</h2>
        {menu?.categories?.length ? (
          <div className="space-y-3">
            {menu.categories.map((cat) => (
              <div key={cat.name}>
                <p className="text-sm font-medium text-textPrimary mb-1">{cat.name}</p>
                <ul className="text-xs text-textSecondary space-y-0.5">
                  {cat.items.map((item) => (
                    <li key={item.name} className="flex justify-between">
                      <span>{item.name}</span>
                      <span>₹{item.price}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-textSecondary">No menu items.</p>
        )}
      </div>

      <div className="border border-border rounded-md bg-surface p-4 space-y-2">
        <label className="block text-xs text-textSecondary mb-1">
          Rejection reason (required if rejecting)
        </label>
        <textarea
          rows={3}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            disabled={submitting}
            onClick={handleReject}
            className="px-4 py-2 text-xs font-medium rounded-md border border-red-500 text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            Reject
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleApprove}
            className="px-4 py-2 text-xs font-medium rounded-md bg-primary text-white hover:bg-primary/90 disabled:opacity-60"
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminRestaurantPage

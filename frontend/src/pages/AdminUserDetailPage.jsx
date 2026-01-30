import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../utils/api'

const AdminUserDetailPage = () => {
  const navigate = useNavigate()
  const { userId } = useParams()
  const [user, setUser] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const role = localStorage.getItem('auth_role')
    const token = localStorage.getItem('auth_token')
    if (role !== 'admin' || !token) {
      navigate('/admin/login')
      return
    }

    const fetchData = async () => {
      try {
        const [userRes, ordersRes] = await Promise.all([
          api.get('/admin/users'),
          api.get(`/admin/users/${userId}/orders`),
        ])
        const found = userRes.data.find((u) => u.id === Number(userId))
        setUser(found || null)
        setOrders(ordersRes.data)
      } catch (err) {
        console.error('Failed to load user detail:', err)
        setError('Failed to load user detail.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [navigate, userId])

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Delete this order?')) return
    setError('')
    try {
      await api.delete(`/admin/orders/${orderId}`)
      setOrders((prev) => prev.filter((o) => o.id !== orderId))
    } catch (err) {
      console.error('Failed to delete order:', err)
      setError('Failed to delete order.')
    }
  }

  const handleApproveOrder = async (orderId) => {
    setError('')
    try {
      const { data } = await api.post(`/admin/orders/${orderId}/approve`)
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: data.status } : o)))
    } catch (err) {
      console.error('Failed to approve order:', err)
      setError('Failed to approve order.')
    }
  }

  const handleRejectOrder = async (orderId) => {
    setError('')
    try {
      const { data } = await api.post(`/admin/orders/${orderId}/reject`)
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: data.status } : o)))
    } catch (err) {
      console.error('Failed to reject order:', err)
      setError('Failed to reject order.')
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <p className="text-sm text-textSecondary">Loading user details...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <p className="text-sm text-red-600">User not found.</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <button
        type="button"
        onClick={() => navigate('/admin/dashboard')}
        className="mb-4 text-xs text-primary hover:underline"
      >
        ← Back to dashboard
      </button>

      <h1 className="text-xl font-semibold text-textPrimary mb-2">User Details</h1>
      <p className="text-xs text-textSecondary mb-4">
        ID: {user.id} · Email: {user.email} · Role: {user.role} ·
        {' '}Verified: {user.is_verified ? 'Yes' : 'No'}
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <h2 className="text-sm font-semibold text-textPrimary mb-2">Orders</h2>
      {orders.length === 0 ? (
        <p className="text-sm text-textSecondary">No orders for this user.</p>
      ) : (
        <table className="w-full text-xs border border-border bg-surface">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left border-b border-border">ID</th>
              <th className="px-3 py-2 text-left border-b border-border">Customer ID</th>
              <th className="px-3 py-2 text-left border-b border-border">Restaurant ID</th>
              <th className="px-3 py-2 text-left border-b border-border">Total</th>
              <th className="px-3 py-2 text-left border-b border-border">Status</th>
              <th className="px-3 py-2 text-left border-b border-border">Payment</th>
              <th className="px-3 py-2 text-left border-b border-border">Created At</th>
              <th className="px-3 py-2 text-left border-b border-border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-border">
                <td className="px-3 py-2 text-xs">{o.id}</td>
                <td className="px-3 py-2 text-xs">{o.customer_id}</td>
                <td className="px-3 py-2 text-xs">{o.restaurant_id}</td>
                <td className="px-3 py-2 text-xs">₹{o.total_amount}</td>
                <td className="px-3 py-2 text-xs">{o.status}</td>
                <td className="px-3 py-2 text-xs">{o.payment_status}</td>
                <td className="px-3 py-2 text-xs">
                  {o.created_at && new Date(o.created_at).toLocaleString()}
                </td>
                <td className="px-3 py-2 text-xs space-x-2">
                  {o.status === 'PENDING' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleApproveOrder(o.id)}
                        className="px-2 py-1 rounded-md border border-green-500 text-green-600 hover:bg-green-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRejectOrder(o.id)}
                        className="px-2 py-1 rounded-md border border-amber-500 text-amber-600 hover:bg-amber-50"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteOrder(o.id)}
                    className="px-2 py-1 rounded-md border border-red-500 text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default AdminUserDetailPage

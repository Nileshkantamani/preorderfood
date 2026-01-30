import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'

const AdminDashboardPage = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('pending') // 'pending' | 'restaurants' | 'users'
  const [pending, setPending] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingRestaurantId, setSavingRestaurantId] = useState(null)
  const [error, setError] = useState('')

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user and all related data?')) return
    setError('')
    try {
      await api.delete(`/admin/users/${userId}`)
      setUsers((prev) => prev.filter((u) => u.id !== userId))
    } catch (err) {
      console.error('Failed to delete user:', err)
      setError('Failed to delete user.')
    }
  }

  const handleViewUser = (userId) => {
    navigate(`/admin/users/${userId}`)
  }

  useEffect(() => {
    // Check auth first
    const role = localStorage.getItem('auth_role')
    const token = localStorage.getItem('auth_token')

    console.log('Auth check:', { role, hasToken: !!token }) // Debug

    if (role !== 'admin') {
      navigate('/admin/login')
      return
    }

    if (!token) {
      navigate('/admin/login')
      return
    }

    const fetchAll = async () => {
      try {
        console.log('Fetching admin dashboard data...')

        const [pendingRes, restaurantsRes, usersRes] = await Promise.all([
          api.get('/admin/pending-restaurants'),
          api.get('/admin/restaurants'),
          api.get('/admin/users'),
        ])

        setPending(pendingRes.data)
        setRestaurants(restaurantsRes.data)
        setUsers(usersRes.data)
        setError('') // Clear any previous errors
        
      } catch (err) {
        console.error('Error fetching admin data:', err)
        
        if (err.response?.status === 401) {
          setError('Session expired. Please login again.')
          // Clear invalid token
          localStorage.removeItem('auth_token')
          localStorage.removeItem('auth_role')
          setTimeout(() => navigate('/admin/login'), 2000)
        } else {
          setError('Failed to load admin data.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [navigate])

  const handleView = (id) => {
    navigate(`/admin/restaurant/${id}`)
  }

  const handleRestaurantFieldChange = (id, field, value) => {
    setRestaurants((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    )
  }

  const handleSaveRestaurant = async (restaurant) => {
    setSavingRestaurantId(restaurant.id)
    setError('')
    try {
      const payload = {
        restaurant_name: restaurant.restaurant_name,
        business_phone: restaurant.business_phone,
        state: restaurant.state,
        city: restaurant.city,
        address: restaurant.address,
        pincode: restaurant.pincode,
        opening_time: restaurant.opening_time,
        closing_time: restaurant.closing_time,
        status: restaurant.status,
        is_visible: restaurant.is_visible,
      }
      const { data } = await api.put(`/admin/restaurants/${restaurant.id}`, payload)
      setRestaurants((prev) => prev.map((r) => (r.id === data.id ? data : r)))
    } catch (err) {
      console.error('Failed to update restaurant as admin:', err)
      setError('Failed to update restaurant.')
    } finally {
      setSavingRestaurantId(null)
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <p className="text-sm text-textSecondary">Loading admin data...</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold text-textPrimary mb-4">Admin Dashboard</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="mb-4 flex gap-2 border-b border-border text-xs">
        <button
          className={`px-3 py-2 border-b-2 ${
            activeTab === 'pending' ? 'border-primary text-primary' : 'border-transparent text-textSecondary'
          }`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Restaurants
        </button>
        <button
          className={`px-3 py-2 border-b-2 ${
            activeTab === 'restaurants' ? 'border-primary text-primary' : 'border-transparent text-textSecondary'
          }`}
          onClick={() => setActiveTab('restaurants')}
        >
          All Restaurants
        </button>
        <button
          className={`px-3 py-2 border-b-2 ${
            activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-textSecondary'
          }`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
      </div>

      {activeTab === 'pending' && (
        <>
          {pending.length === 0 ? (
            <p className="text-sm text-textSecondary">No pending restaurants.</p>
          ) : (
            <table className="w-full text-sm border border-border bg-surface">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left border-b border-border">Name</th>
                  <th className="px-3 py-2 text-left border-b border-border">City</th>
                  <th className="px-3 py-2 text-left border-b border-border">Phone</th>
                  <th className="px-3 py-2 text-left border-b border-border">Status</th>
                  <th className="px-3 py-2 text-left border-b border-border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((r) => (
                  <tr key={r.id} className="border-b border-border">
                    <td className="px-3 py-2">{r.restaurant_name}</td>
                    <td className="px-3 py-2">{r.city}</td>
                    <td className="px-3 py-2">{r.business_phone}</td>
                    <td className="px-3 py-2 text-xs">{r.status}</td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => handleView(r.id)}
                        className="px-3 py-1 text-xs rounded-md border border-border text-textSecondary hover:bg-slate-50"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {activeTab === 'restaurants' && (
        <>
          {restaurants.length === 0 ? (
            <p className="text-sm text-textSecondary">No restaurants found.</p>
          ) : (
            <table className="w-full text-xs border border-border bg-surface">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-2 py-2 text-left border-b border-border">Name</th>
                  <th className="px-2 py-2 text-left border-b border-border">City</th>
                  <th className="px-2 py-2 text-left border-b border-border">Status</th>
                  <th className="px-2 py-2 text-left border-b border-border">Visible</th>
                  <th className="px-2 py-2 text-left border-b border-border">Opening</th>
                  <th className="px-2 py-2 text-left border-b border-border">Closing</th>
                  <th className="px-2 py-2 text-left border-b border-border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {restaurants.map((r) => (
                  <tr key={r.id} className="border-b border-border">
                    <td className="px-2 py-2 text-xs">{r.restaurant_name}</td>
                    <td className="px-2 py-2 text-xs">
                      <input
                        type="text"
                        value={r.city || ''}
                        onChange={(e) => handleRestaurantFieldChange(r.id, 'city', e.target.value)}
                        className="w-full border border-border rounded px-1 py-0.5 text-xs bg-surface"
                      />
                    </td>
                    <td className="px-2 py-2 text-xs">
                      <select
                        value={r.status}
                        onChange={(e) => handleRestaurantFieldChange(r.id, 'status', e.target.value)}
                        className="border border-border rounded px-1 py-0.5 text-xs bg-surface"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="APPROVED">APPROVED</option>
                        <option value="REJECTED">REJECTED</option>
                      </select>
                    </td>
                    <td className="px-2 py-2 text-xs">
                      <input
                        type="checkbox"
                        checked={r.is_visible}
                        onChange={(e) => handleRestaurantFieldChange(r.id, 'is_visible', e.target.checked)}
                      />
                    </td>
                    <td className="px-2 py-2 text-xs">
                      <input
                        type="time"
                        value={r.opening_time}
                        onChange={(e) => handleRestaurantFieldChange(r.id, 'opening_time', e.target.value)}
                        className="border border-border rounded px-1 py-0.5 text-xs bg-surface"
                      />
                    </td>
                    <td className="px-2 py-2 text-xs">
                      <input
                        type="time"
                        value={r.closing_time}
                        onChange={(e) => handleRestaurantFieldChange(r.id, 'closing_time', e.target.value)}
                        className="border border-border rounded px-1 py-0.5 text-xs bg-surface"
                      />
                    </td>
                    <td className="px-2 py-2 text-xs space-x-2">
                      <button
                        onClick={() => handleSaveRestaurant(r)}
                        disabled={savingRestaurantId === r.id}
                        className="px-2 py-1 rounded-md border border-border text-textSecondary hover:bg-slate-50 disabled:opacity-60"
                      >
                        {savingRestaurantId === r.id ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => handleView(r.id)}
                        className="px-2 py-1 rounded-md border border-border text-textSecondary hover:bg-slate-50"
                      >
                        Edit Menu
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {activeTab === 'users' && (
        <>
          {users.length === 0 ? (
            <p className="text-sm text-textSecondary">No users found.</p>
          ) : (
            <table className="w-full text-xs border border-border bg-surface">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left border-b border-border">ID</th>
                  <th className="px-3 py-2 text-left border-b border-border">Email</th>
                  <th className="px-3 py-2 text-left border-b border-border">Role</th>
                  <th className="px-3 py-2 text-left border-b border-border">Verified</th>
                  <th className="px-3 py-2 text-left border-b border-border">Created At</th>
                  <th className="px-3 py-2 text-left border-b border-border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border">
                    <td className="px-3 py-2 text-xs">{u.id}</td>
                    <td className="px-3 py-2 text-xs">{u.email}</td>
                    <td className="px-3 py-2 text-xs">{u.role}</td>
                    <td className="px-3 py-2 text-xs">{u.is_verified ? 'Yes' : 'No'}</td>
                    <td className="px-3 py-2 text-xs">
                      {u.created_at && new Date(u.created_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-xs space-x-2">
                      <button
                        type="button"
                        onClick={() => handleViewUser(u.id)}
                        className="px-2 py-1 rounded-md border border-border text-textSecondary hover:bg-slate-50"
                      >
                        View details
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u.id)}
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
        </>
      )}
    </div>
  )
}

export default AdminDashboardPage
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'

const AdminDashboardPage = () => {
  const navigate = useNavigate()
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

    // Fetch pending restaurants
    const fetchPending = async () => {
      try {
        console.log('Fetching pending restaurants...') // Debug
        
        const { data } = await api.get('/admin/pending-restaurants')
        
        console.log('Fetched restaurants:', data) // Debug
        setPending(data)
        setError('') // Clear any previous errors
        
      } catch (err) {
        console.error('Error fetching pending restaurants:', err) // Debug
        
        if (err.response?.status === 401) {
          setError('Session expired. Please login again.')
          // Clear invalid token
          localStorage.removeItem('auth_token')
          localStorage.removeItem('auth_role')
          setTimeout(() => navigate('/admin/login'), 2000)
        } else {
          setError('Failed to load pending restaurants.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchPending()
  }, [navigate])

  const handleView = (id) => {
    navigate(`/admin/restaurant/${id}`)
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-sm text-textSecondary">Loading pending restaurants...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold text-textPrimary mb-4">Pending Restaurants</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
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
    </div>
  )
}

export default AdminDashboardPage
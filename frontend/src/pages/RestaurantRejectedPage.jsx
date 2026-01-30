// frontend/src/pages/RestaurantRejectedPage.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import Loader from '../components/Loader'
import Toast from '../components/Toast'

const RestaurantRejectedPage = () => {
  const navigate = useNavigate()
  const [restaurant, setRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const role = localStorage.getItem('auth_role')
    if (role !== 'restaurant') {
      navigate('/login')
      return
    }

    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/restaurant/profile')
        if (data.status === 'APPROVED') {
          navigate('/restaurant/dashboard')
          return
        }
        if (data.status === 'PENDING') {
          navigate('/restaurant/pending')
          return
        }
        setRestaurant(data)
      } catch {
        setError('Failed to load restaurant profile.')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_role')
    navigate('/login')
  }

  if (loading) return <Loader text="Loading..." />

  return (
    <div className="flex justify-center items-center py-16 px-4">
      <Toast message={error} onClose={() => setError('')} />
      <div className="max-w-md w-full bg-surface border border-border rounded-lg p-6 text-center">
        <div className="text-4xl mb-2">❌</div>
        <h1 className="text-xl font-semibold text-textPrimary mb-1">
          Registration Rejected
        </h1>
        <p className="text-xs text-textSecondary mb-4">
          Unfortunately, your restaurant registration was not approved.
        </p>
        {restaurant && restaurant.status === 'REJECTED' && (
          <p className="text-xs text-textSecondary mb-4">
            {/* Reason is stored on Restaurant as rejection_reason from admin side */}
            <span className="font-medium">Reason:</span>{' '}
            {restaurant.rejection_reason || 'No reason provided.'}
          </p>
        )}
        <p className="text-xs text-textSecondary mb-4">
          If you believe this was an error, please contact support.
        </p>
        <div className="flex justify-center gap-3 mt-2">
          <button
            onClick={() => (window.location.href = 'mailto:support@example.com')}
            className="px-4 py-2 text-sm font-medium rounded-md border border-border text-textSecondary hover:bg-slate-50"
          >
            Contact Support
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-white hover:bg-primary/90"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

export default RestaurantRejectedPage
// frontend/src/pages/RestaurantPendingPage.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import Loader from '../components/Loader'
import Toast from '../components/Toast'

const RestaurantPendingPage = () => {
  const navigate = useNavigate()
  const [restaurant, setRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    const role = localStorage.getItem('auth_role')

    // If the user is not logged in (typical case right after registration),
    // simply show the generic pending message without calling the backend.
    if (!token) {
      setLoading(false)
      return
    }

    // If there is a token but it's not a restaurant account, send them away.
    if (role !== 'restaurant') {
      navigate('/')
      return
    }

    const fetchStatus = async () => {
      try {
        const { data } = await api.get('/restaurant/profile')
        // data.status: PENDING | APPROVED | REJECTED
        if (data.status === 'APPROVED') {
          navigate('/restaurant/dashboard')
          return
        }
        if (data.status === 'REJECTED') {
          navigate('/restaurant/rejected')
          return
        }
        setRestaurant(data)
      } catch {
        setError('Failed to load restaurant status.')
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_role')
    navigate('/login')
  }

  if (loading) return <Loader text="Checking approval status..." />

  return (
    <div className="flex justify-center items-center py-16 px-4">
      <Toast message={error} onClose={() => setError('')} />
      <div className="max-w-md w-full bg-surface border border-border rounded-lg p-6 text-center">
        <div className="text-4xl mb-2">⏳</div>
        <h1 className="text-xl font-semibold text-textPrimary mb-1">
          Registration Pending
        </h1>
        <p className="text-xs text-textSecondary mb-4">
          Your restaurant registration is currently under review by our team.
          You will receive an email once your restaurant is approved.
        </p>
        <p className="text-xs text-textSecondary mb-4">
          Expected approval time: <span className="font-medium">24–48 hours</span>.
        </p>

        {restaurant && (
          <div className="text-xs text-left text-textSecondary border border-border rounded-md p-3 mb-4">
            <p>
              <span className="font-medium">Restaurant:</span>{' '}
              {restaurant.restaurant_name}
            </p>
            <p>
              <span className="font-medium">Phone:</span>{' '}
              {restaurant.business_phone}
            </p>
            {/* Email is not in RestaurantProfileResponse; optional to show separately if you store it */}
          </div>
        )}

        <button
          onClick={handleLogout}
          className="mt-2 px-4 py-2 text-sm font-medium rounded-md border border-border text-textSecondary hover:bg-slate-50"
        >
          Logout
        </button>
      </div>
    </div>
  )
}

export default RestaurantPendingPage
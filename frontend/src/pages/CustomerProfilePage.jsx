// frontend/src/pages/CustomerProfilePage.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import Loader from '../components/Loader'
import Toast from '../components/Toast'

const CustomerProfilePage = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const role = localStorage.getItem('auth_role')
    if (role !== 'customer') {
      navigate('/login')
      return
    }
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/customer/profile')
        setForm(data)
      } catch {
        setError('Failed to load profile.')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [navigate])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.name || form.name.length < 2) {
      setError('Name must be at least 2 characters.')
      return
    }
    if (!/^\d{10}$/.test(form.phone)) {
      setError('Phone must be 10 digits.')
      return
    }

    setSaving(true)
    try {
      const { data } = await api.put('/customer/profile', {
        name: form.name,
        email: form.email,
        phone: form.phone,
      })
      setForm(data)
      setSuccess('Profile updated successfully.')
    } catch {
      setError('Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loader text="Loading profile..." />

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 grid gap-8 md:grid-cols-[1.5fr,1fr]">
      <Toast message={error || success} type={error ? 'error' : 'success'} onClose={() => { setError(''); setSuccess('') }} />

      {/* Left: profile form */}
      <div className="bg-surface border border-border rounded-md p-6">
        <h1 className="text-xl font-semibold text-textPrimary mb-1">
          Profile
        </h1>
        <p className="text-xs text-textSecondary mb-4">
          View and update your information.
        </p>

        <form onSubmit={handleSave} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs text-textSecondary mb-1">
              Name
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-md bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-textSecondary mb-1">
              Email
            </label>
            <input
              name="email"
              value={form.email}
              disabled
              className="w-full px-3 py-2 border border-border rounded-md bg-slate-50 text-textSecondary text-xs"
            />
          </div>
          <div>
            <label className="block text-xs text-textSecondary mb-1">
              Phone
            </label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-md bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Update Profile'}
          </button>
        </form>
      </div>

      {/* Right: stats placeholder */}
      <div className="space-y-4">
        <div className="bg-surface border border-border rounded-md p-6 text-sm">
          <h2 className="text-sm font-semibold text-textPrimary mb-2">
            Your Statistics
          </h2>
          <p className="text-xs text-textSecondary">
            Order statistics will appear here in a future iteration.
          </p>
        </div>
        <div className="bg-surface border border-border rounded-md p-6 text-sm">
          <h2 className="text-sm font-semibold text-textPrimary mb-2">
            Quick Links
          </h2>
          <button
            onClick={() => navigate('/customer/orders')}
            className="text-xs text-primary hover:underline"
          >
            View All Orders
          </button>
        </div>
      </div>
    </div>
  )
}

export default CustomerProfilePage
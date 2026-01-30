import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'

const LoginPage = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const { data } = await api.post('/auth/login', form)
      if (data.role === 'customer') {
        localStorage.setItem('auth_token', data.token)
        localStorage.setItem('auth_role', data.role)
        navigate('/customer/home')
      } else if (data.role === 'restaurant') {
        const status = data.user?.status
        // Backend now blocks non-approved restaurants with 403, but we keep
        // this check as a safety net: never store a token for non-approved
        // restaurants on the client.
        if (status === 'PENDING' || status === 'REJECTED') {
          setError('Your restaurant is still under admin review.')
          navigate('/restaurant/pending')
          return
        }
        localStorage.setItem('auth_token', data.token)
        localStorage.setItem('auth_role', data.role)
        navigate('/restaurant/dashboard')
      } else if (data.role === 'admin') {
        localStorage.setItem('auth_token', data.token)
        localStorage.setItem('auth_role', data.role)
        navigate('/admin/dashboard')
      } else {
        navigate('/')
      }
    } catch (err) {
      const status = err.response?.status
      const detail = err.response?.data?.detail

      // If backend ever returns an explicit not-approved error for restaurants
      // (e.g. 403), surface a clear message and send them to the pending page.
      if (
        status === 403 ||
        detail?.code === 'RESTAURANT_NOT_APPROVED' ||
        detail?.message?.toLowerCase().includes('not approved')
      ) {
        setError('Your restaurant is still under admin review.')
        navigate('/restaurant/pending')
      } else {
        setError('Invalid email or password.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex justify-center items-center py-12 px-4">
      <div className="max-w-md w-full bg-surface border border-border rounded-xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-textPrimary mb-2">Login</h2>
        <p className="text-sm text-textSecondary mb-6">Sign in to continue.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-textSecondary mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-md border border-border bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-textSecondary mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-md border border-border bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 px-4 py-2 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-xs text-textSecondary text-center mt-4">
          Need an account?{' '}
          <Link to="/register" className="text-primary hover:underline">Register</Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage

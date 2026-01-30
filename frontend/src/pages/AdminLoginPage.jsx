import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'

const AdminLoginPage = () => {
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
      if (data.role !== 'admin') {
        setError('Not an admin account.')
      } else {
        localStorage.setItem('auth_token', data.token)
        localStorage.setItem('auth_role', data.role)
        navigate('/admin/dashboard')
      }
    } catch (err) {
      setError('Invalid credentials.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex justify-center items-center py-12 px-4 bg-background">
      <div className="max-w-sm w-full bg-surface border border-border rounded-lg p-6">
        <h1 className="text-xl font-semibold text-textPrimary mb-1">Admin Login</h1>
        <p className="text-xs text-textSecondary mb-4">Enter your admin credentials.</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-textSecondary mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-textSecondary mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting ? 'Logging in...' : 'Login as Admin'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AdminLoginPage

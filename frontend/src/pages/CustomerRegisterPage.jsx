import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { validateEmail, validatePassword, validatePhone } from '../utils/validators'

const CustomerRegisterPage = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const validate = () => {
    const newErrors = {}
    if (!form.name || form.name.length < 2) newErrors.name = 'Name must be at least 2 characters.'

    const emailError = validateEmail(form.email)
    if (emailError) newErrors.email = emailError

    const phoneError = validatePhone(form.phone)
    if (phoneError) newErrors.phone = phoneError

    const passwordError = validatePassword(form.password)
    if (passwordError) newErrors.password = passwordError

    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match.'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const { data } = await api.post('/auth/register/customer', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      })
      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('auth_role', data.role)
      navigate('/customer/home')
    } catch (err) {
      const detail = err.response?.data?.detail
      if (detail?.field) {
        setErrors({ [detail.field]: detail.message })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex justify-center items-center py-12 px-4">
      <div className="max-w-md w-full bg-surface border border-border rounded-xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-textPrimary mb-2">Create Customer Account</h2>
        <p className="text-sm text-textSecondary mb-6">Sign up to pre-order from restaurants.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-textSecondary mb-1">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-md border border-border bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-textSecondary mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-md border border-border bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-textSecondary mb-1">Phone</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-md border border-border bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
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
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-textSecondary mb-1">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-md border border-border bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 px-4 py-2 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <p className="text-xs text-textSecondary text-center mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline">Login</Link>
        </p>
      </div>
    </div>
  )
}

export default CustomerRegisterPage

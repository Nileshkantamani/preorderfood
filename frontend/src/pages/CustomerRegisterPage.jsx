import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { validateEmail, validatePassword, validatePhone } from '../utils/validators'

const CustomerRegisterPage = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState(1) // 1 = form, 2 = OTP verification
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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
      await api.post('/auth/register/customer', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      })
      // Move to OTP verification step
      setStep(2)
      setOtp('')
      setOtpError('')
    } catch (err) {
      const detail = err.response?.data?.detail
      if (detail?.field) {
        setErrors({ [detail.field]: detail.message })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setOtpError('')
    try {
      await api.post('/auth/verify-email', {
        email: form.email,
        code: otp,
      })
      navigate('/login')
    } catch (err) {
      const detail = err.response?.data?.detail
      const code = detail?.code
      if (code === 'OTP_EXPIRED') {
        setOtpError('Code expired. Please request a new one.')
      } else if (code === 'OTP_INCORRECT') {
        setOtpError('Incorrect code. Please try again.')
      } else if (code === 'OTP_ATTEMPT_LIMIT') {
        setOtpError('Too many incorrect attempts. Please request a new code.')
      } else {
        setOtpError(detail?.message || 'Could not verify code.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleResendOtp = async () => {
    setSubmitting(true)
    setOtpError('')
    try {
      await api.post('/auth/resend-verification', { email: form.email })
    } catch (err) {
      const detail = err.response?.data?.detail
      if (detail?.code === 'OTP_RESEND_LIMIT') {
        setOtpError('Resend limit reached. Please try again later.')
      } else {
        setOtpError(detail?.message || 'Could not resend code.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex justify-center items-center py-12 px-4">
      <div className="max-w-md w-full bg-surface border border-border rounded-xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-textPrimary mb-2">Create Customer Account</h2>
        <p className="text-sm text-textSecondary mb-6">
          {step === 1 ? 'Sign up to pre-order from restaurants.' : 'Enter the OTP sent to your email to verify your account.'}
        </p>

        {step === 1 && (
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
            <div className="flex items-center gap-2">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                className="flex-1 px-3 py-2 rounded-md border border-border bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="px-2 py-1 text-[11px] text-textSecondary border border-border rounded-md"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-textSecondary mb-1">Confirm Password</label>
            <div className="flex items-center gap-2">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                className="flex-1 px-3 py-2 rounded-md border border-border bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="px-2 py-1 text-[11px] text-textSecondary border border-border rounded-md"
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
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
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                disabled
                className="w-full px-3 py-2 rounded-md border border-border bg-surface text-sm text-textSecondary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1">OTP Code</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-border bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {otpError && <p className="text-xs text-red-500 mt-1">{otpError}</p>}
            </div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={submitting}
                className="text-xs text-primary hover:underline disabled:opacity-60"
              >
                Resend code
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
              >
                {submitting ? 'Verifying...' : 'Verify Email'}
              </button>
            </div>
          </form>
        )}

        <p className="text-xs text-textSecondary text-center mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline">Login</Link>
        </p>
      </div>
    </div>
  )
}

export default CustomerRegisterPage

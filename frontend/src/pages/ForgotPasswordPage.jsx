import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../utils/api'
import { validateEmail, validatePassword } from '../utils/validators'

const ForgotPasswordPage = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1 = request, 2 = reset
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleRequest = async (e) => {
    e.preventDefault()
    setError('')
    const emailError = validateEmail(email)
    if (emailError) {
      setError(emailError)
      return
    }
    setSubmitting(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setStep(2)
    } catch (err) {
      // Always show generic message
      setStep(2)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    setError('')

    const pwdError = validatePassword(password)
    if (pwdError) {
      setError(pwdError)
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      await api.post('/auth/reset-password', {
        email,
        code: otp,
        new_password: password,
      })
      navigate('/login')
    } catch (err) {
      const detail = err.response?.data?.detail
      const code = detail?.code
      if (code === 'OTP_EXPIRED') {
        setError('Code expired. Please request a new one.')
      } else if (code === 'OTP_INCORRECT') {
        setError('Incorrect code. Please try again.')
      } else if (code === 'OTP_ATTEMPT_LIMIT') {
        setError('Too many incorrect attempts. Please request a new code.')
      } else {
        setError(detail?.message || 'Could not reset password.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex justify-center items-center py-12 px-4">
      <div className="max-w-md w-full bg-surface border border-border rounded-xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-textPrimary mb-2">Forgot Password</h2>
        <p className="text-sm text-textSecondary mb-6">
          {step === 1
            ? 'Enter your email and we will send you an OTP to reset your password.'
            : 'Enter the OTP and your new password.'}
        </p>

        {step === 1 && (
          <form onSubmit={handleRequest} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-border bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 px-4 py-2 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1">Email</label>
              <input
                type="email"
                value={email}
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
            </div>
            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-border bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-textSecondary mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-border bg-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 px-4 py-2 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <p className="text-xs text-textSecondary text-center mt-4">
          Remembered your password?{' '}
          <Link to="/login" className="text-primary hover:underline">Back to login</Link>
        </p>
      </div>
    </div>
  )
}

export default ForgotPasswordPage

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

  const [newEmail, setNewEmail] = useState('')
  const [emailOtp, setEmailOtp] = useState('')
  const [emailOtpLoading, setEmailOtpLoading] = useState(false)
  const [emailSectionMessage, setEmailSectionMessage] = useState('')

  const [newPhone, setNewPhone] = useState('')
  const [phoneOtp, setPhoneOtp] = useState('')
  const [phoneOtpLoading, setPhoneOtpLoading] = useState(false)
  const [phoneSectionMessage, setPhoneSectionMessage] = useState('')

  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passwordOtp, setPasswordOtp] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordSectionMessage, setPasswordSectionMessage] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)

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
    setSuccess('Use the sections below to change your email, phone, or password.')
    setSaving(false)
  }

  const handleRequestEmailChange = async () => {
    setEmailSectionMessage('')
    setError('')
    if (!newEmail) {
      setEmailSectionMessage('Please enter a new email.')
      return
    }
    setEmailOtpLoading(true)
    try {
      await api.post('/auth/profile/change-email/request', { new_email: newEmail })
      setEmailSectionMessage('If the email is valid, a verification code has been sent to it.')
    } catch (err) {
      const detail = err.response?.data?.detail
      setEmailSectionMessage(detail?.message || 'Could not start email change.')
    } finally {
      setEmailOtpLoading(false)
    }
  }

  const handleVerifyEmailChange = async () => {
    setEmailSectionMessage('')
    setError('')
    if (!emailOtp) {
      setEmailSectionMessage('Please enter the OTP code sent to your new email.')
      return
    }
    setEmailOtpLoading(true)
    try {
      await api.post('/auth/profile/change-email/verify', { new_email: newEmail, code: emailOtp })
      setForm((prev) => ({ ...prev, email: newEmail }))
      setNewEmail('')
      setEmailOtp('')
      setSuccess('Email updated successfully.')
    } catch (err) {
      const detail = err.response?.data?.detail
      setEmailSectionMessage(detail?.message || 'Could not verify email change.')
    } finally {
      setEmailOtpLoading(false)
    }
  }

  const handleRequestPhoneChange = async () => {
    setPhoneSectionMessage('')
    setError('')
    if (!/^\d{10}$/.test(newPhone)) {
      setPhoneSectionMessage('Phone must be 10 digits.')
      return
    }
    setPhoneOtpLoading(true)
    try {
      await api.post('/auth/profile/change-phone/request', { new_phone: newPhone })
      setPhoneSectionMessage('If the request is valid, a verification code has been sent to your email.')
    } catch (err) {
      const detail = err.response?.data?.detail
      setPhoneSectionMessage(detail?.message || 'Could not start phone change.')
    } finally {
      setPhoneOtpLoading(false)
    }
  }

  const handleVerifyPhoneChange = async () => {
    setPhoneSectionMessage('')
    setError('')
    if (!phoneOtp) {
      setPhoneSectionMessage('Please enter the OTP code sent to your email.')
      return
    }
    setPhoneOtpLoading(true)
    try {
      await api.post('/auth/profile/change-phone/verify', { new_phone: newPhone, code: phoneOtp })
      setForm((prev) => ({ ...prev, phone: newPhone }))
      setNewPhone('')
      setPhoneOtp('')
      setSuccess('Phone updated successfully.')
    } catch (err) {
      const detail = err.response?.data?.detail
      setPhoneSectionMessage(detail?.message || 'Could not verify phone change.')
    } finally {
      setPhoneOtpLoading(false)
    }
  }

  const handleRequestPasswordChange = async () => {
    setPasswordSectionMessage('')
    setError('')
    if (!currentPassword) {
      setPasswordSectionMessage('Please enter your current password.')
      return
    }
    if (!newPassword || newPassword.length < 8) {
      setPasswordSectionMessage('New password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordSectionMessage('New password and confirmation do not match.')
      return
    }
    setPasswordLoading(true)
    try {
      await api.post('/auth/profile/change-password/request', {
        current_password: currentPassword,
        new_password: newPassword,
      })
      setPasswordSectionMessage('If the credentials are valid, a verification code has been sent to your email.')
    } catch (err) {
      const detail = err.response?.data?.detail
      setPasswordSectionMessage(detail?.message || 'Could not start password change.')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleVerifyPasswordChange = async () => {
    setPasswordSectionMessage('')
    setError('')
    if (!passwordOtp) {
      setPasswordSectionMessage('Please enter the OTP code sent to your email.')
      return
    }
    if (!newPassword || newPassword.length < 8) {
      setPasswordSectionMessage('New password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordSectionMessage('New password and confirmation do not match.')
      return
    }
    setPasswordLoading(true)
    try {
      await api.post('/auth/profile/change-password/verify', {
        code: passwordOtp,
        new_password: newPassword,
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
      setPasswordOtp('')
      setShowPasswordSection(false)
      setSuccess('Password updated successfully.')
    } catch (err) {
      const detail = err.response?.data?.detail
      setPasswordSectionMessage(detail?.message || 'Could not verify password change.')
    } finally {
      setPasswordLoading(false)
    }
  }

  if (loading) return <Loader text="Loading profile..." />

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 grid gap-8 md:grid-cols-[1.5fr,1fr]">
      <Toast
        message={error || success}
        type={error ? 'error' : 'success'}
        onClose={() => {
          setError('')
          setSuccess('')
        }}
      />

      {/* Left: profile form */}
      <div className="bg-surface border border-border rounded-md p-6">
        <h1 className="text-xl font-semibold text-textPrimary mb-1">Profile</h1>
        <p className="text-xs text-textSecondary mb-4">View and update your information.</p>

        <form onSubmit={handleSave} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs text-textSecondary mb-1">Name</label>
            <input
              name="name"
              value={form.name}
              disabled
              className="w-full px-3 py-2 border border-border rounded-md bg-slate-50 text-textSecondary"
            />
          </div>
          <div>
            <label className="block text-xs text-textSecondary mb-1">Email</label>
            <input
              name="email"
              value={form.email}
              disabled
              className="w-full px-3 py-2 border border-border rounded-md bg-slate-50 text-textSecondary text-xs"
            />
          </div>
          <div>
            <label className="block text-xs text-textSecondary mb-1">Phone</label>
            <input
              name="phone"
              value={form.phone}
              disabled
              className="w-full px-3 py-2 border border-border rounded-md bg-slate-50 text-textSecondary"
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

        <div className="mt-6 space-y-4 text-xs">
          <div>
            <h2 className="text-sm font-semibold text-textPrimary mb-2">Change Email</h2>
            <div className="space-y-2">
              <input
                type="email"
                placeholder="New email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="OTP code"
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value)}
                  className="flex-1 px-3 py-2 border border-border rounded-md bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={handleRequestEmailChange}
                  disabled={emailOtpLoading}
                  className="px-3 py-2 rounded-md border border-border text-[11px] text-textSecondary hover:bg-slate-50 disabled:opacity-60"
                >
                  Send OTP
                </button>
                <button
                  type="button"
                  onClick={handleVerifyEmailChange}
                  disabled={emailOtpLoading}
                  className="px-3 py-2 rounded-md bg-primary text-white text-[11px] font-medium hover:bg-primary/90 disabled:opacity-60"
                >
                  Verify & Update
                </button>
              </div>
              {emailSectionMessage && (
                <p className="text-[11px] text-textSecondary mt-1">{emailSectionMessage}</p>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <h2 className="text-sm font-semibold text-textPrimary mb-2">Change Phone</h2>
            <div className="space-y-2">
              <input
                type="tel"
                placeholder="New phone (10 digits)"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="OTP code"
                  value={phoneOtp}
                  onChange={(e) => setPhoneOtp(e.target.value)}
                  className="flex-1 px-3 py-2 border border-border rounded-md bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={handleRequestPhoneChange}
                  disabled={phoneOtpLoading}
                  className="px-3 py-2 rounded-md border border-border text-[11px] text-textSecondary hover:bg-slate-50 disabled:opacity-60"
                >
                  Send OTP
                </button>
                <button
                  type="button"
                  onClick={handleVerifyPhoneChange}
                  disabled={phoneOtpLoading}
                  className="px-3 py-2 rounded-md bg-primary text-white text-[11px] font-medium hover:bg-primary/90 disabled:opacity-60"
                >
                  Verify & Update
                </button>
              </div>
              {phoneSectionMessage && (
                <p className="text-[11px] text-textSecondary mt-1">{phoneSectionMessage}</p>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <h2 className="text-sm font-semibold text-textPrimary mb-2">Security</h2>
            {!showPasswordSection && (
              <button
                type="button"
                onClick={() => setShowPasswordSection(true)}
                className="px-3 py-2 rounded-md border border-border text-[11px] text-textSecondary hover:bg-slate-50"
              >
                Change Password
              </button>
            )}
            {showPasswordSection && (
              <div className="mt-3 space-y-2">
                <div>
                  <label className="block text-[11px] text-textSecondary mb-1">Current Password</label>
                  <div className="flex items-center gap-2">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-md border border-border bg-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword((v) => !v)}
                      className="text-[11px] text-textSecondary px-2 py-1 border border-border rounded-md"
                    >
                      {showCurrentPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-textSecondary mb-1">New Password</label>
                  <div className="flex items-center gap-2">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-md border border-border bg-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((v) => !v)}
                      className="text-[11px] text-textSecondary px-2 py-1 border border-border rounded-md"
                    >
                      {showNewPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-textSecondary mb-1">Confirm New Password</label>
                  <div className="flex items-center gap-2">
                    <input
                      type={showConfirmNewPassword ? 'text' : 'password'}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-md border border-border bg-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPassword((v) => !v)}
                      className="text-[11px] text-textSecondary px-2 py-1 border border-border rounded-md"
                    >
                      {showConfirmNewPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-textSecondary mb-1">OTP Code</label>
                  <input
                    type="text"
                    value={passwordOtp}
                    onChange={(e) => setPasswordOtp(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-border bg-surface text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                {passwordSectionMessage && (
                  <p className="text-[11px] text-textSecondary mt-1">{passwordSectionMessage}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleRequestPasswordChange}
                    disabled={passwordLoading}
                    className="px-3 py-2 rounded-md border border-border text-[11px] text-textSecondary hover:bg-slate-50 disabled:opacity-60"
                  >
                    Send OTP
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyPasswordChange}
                    disabled={passwordLoading}
                    className="px-3 py-2 rounded-md bg-primary text-white text-[11px] font-medium hover:bg-primary/90 disabled:opacity-60"
                  >
                    Update Password
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordSection(false)
                      setCurrentPassword('')
                      setNewPassword('')
                      setConfirmNewPassword('')
                      setPasswordOtp('')
                      setPasswordSectionMessage('')
                    }}
                    className="ml-auto px-3 py-2 rounded-md border border-border text-[11px] text-textSecondary hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: stats placeholder */}
      <div className="space-y-4">
        <div className="bg-surface border border-border rounded-md p-6 text-sm">
          <h2 className="text-sm font-semibold text-textPrimary mb-2">Your Statistics</h2>
          <p className="text-xs text-textSecondary">
            Order statistics will appear here in a future iteration.
          </p>
        </div>
        <div className="bg-surface border border-border rounded-md p-6 text-sm">
          <h2 className="text-sm font-semibold text-textPrimary mb-2">Quick Links</h2>
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
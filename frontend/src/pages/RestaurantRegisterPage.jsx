import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { validateEmail, validatePassword, validatePhone, validatePincode } from '../utils/validators'

const emptyCategory = () => ({ name: '', items: [{ name: '', price: '' }] })

const RestaurantRegisterPage = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [details, setDetails] = useState({
    restaurant_name: '',
    phone: '',
    state: '',
    city: '',
    address: '',
    pincode: '',
    opening_time: '',
    closing_time: '',
    email: '',
    password: '',
  })
  const [categories, setCategories] = useState([emptyCategory()])
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const handleDetailChange = (e) => {
    setDetails({ ...details, [e.target.name]: e.target.value })
  }

  const handleCategoryName = (index, value) => {
    const next = [...categories]
    next[index].name = value
    setCategories(next)
  }

  const handleItemChange = (cIndex, iIndex, field, value) => {
    const next = [...categories]
    next[cIndex].items[iIndex][field] = value
    setCategories(next)
  }

  const addCategory = () => setCategories([...categories, emptyCategory()])

  const removeCategory = (index) => {
    const next = categories.filter((_, i) => i !== index)
    setCategories(next.length ? next : [emptyCategory()])
  }

  const addItem = (cIndex) => {
    const next = [...categories]
    next[cIndex].items.push({ name: '', price: '' })
    setCategories(next)
  }

  const removeItem = (cIndex, iIndex) => {
    const next = [...categories]
    next[cIndex].items = next[cIndex].items.filter((_, idx) => idx !== iIndex)
    if (!next[cIndex].items.length) next[cIndex].items.push({ name: '', price: '' })
    setCategories(next)
  }

  const validateStep1 = () => {
    const e = {}
    if (!details.restaurant_name) e.restaurant_name = 'Required'
    {
      const err = validatePhone(details.phone)
      if (err) e.phone = err
    }
    if (!details.state) e.state = 'Required'
    if (!details.city) e.city = 'Required'
    if (!details.address) e.address = 'Required'
    {
      const err = validatePincode(details.pincode)
      if (err) e.pincode = err
    }
    if (!details.opening_time) e.opening_time = 'Required'
    if (!details.closing_time) e.closing_time = 'Required'
    {
      const err = validateEmail(details.email)
      if (err) e.email = err
    }
    {
      const err = validatePassword(details.password)
      if (err) e.password = err
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateStep2 = () => {
    const e = {}
    if (!categories.length) e.categories = 'At least one category is required.'
    categories.forEach((cat, ci) => {
      if (!cat.name) e[`cat-${ci}`] = 'Category name required'
      if (!cat.items.length) e[`items-${ci}`] = 'At least one item required'
      cat.items.forEach((item, ii) => {
        if (!item.name || !item.price) e[`item-${ci}-${ii}`] = 'Name and price required'
      })
    })
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validateStep2()) return
    setSubmitting(true)
    try {
      const menu = {
        categories: categories.map((c) => ({
          name: c.name,
          items: c.items.map((i) => ({ name: i.name, price: Number(i.price) })),
        })),
      }
      const { data } = await api.post('/auth/register/restaurant', {
        ...details,
        menu,
      })
      // Backend always creates restaurant with status=PENDING. We don't
      // auto-login here; instead we redirect to the pending page.
      if (data?.status === 'PENDING') {
        navigate('/restaurant/pending', { state: { justRegistered: true } })
      } else {
        // Fallback: if API shape ever changes, still send them to pending.
        navigate('/restaurant/pending')
      }
    } catch (err) {
      const detail = err.response?.data?.detail
      if (detail?.field) setErrors({ [detail.field]: detail.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex justify-center py-10 px-4">
      <div className="w-full max-w-3xl bg-surface border border-border rounded-xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-textPrimary mb-2">Register Your Restaurant</h2>
        <p className="text-sm text-textSecondary mb-6">Provide your details and build your menu.</p>

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-textSecondary mb-1">Restaurant Name</label>
                <input
                  name="restaurant_name"
                  value={details.restaurant_name}
                  onChange={handleDetailChange}
                  className="w-full px-3 py-2 rounded-md border border-border text-sm focus:ring-1 focus:ring-primary"
                />
                {errors.restaurant_name && <p className="text-xs text-red-500 mt-1">{errors.restaurant_name}</p>}
              </div>
              <div>
                <label className="block text-xs text-textSecondary mb-1">Business Phone</label>
                <input
                  name="phone"
                  value={details.phone}
                  onChange={handleDetailChange}
                  className="w-full px-3 py-2 rounded-md border border-border text-sm focus:ring-1 focus:ring-primary"
                />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="block text-xs text-textSecondary mb-1">State</label>
                <input
                  name="state"
                  value={details.state}
                  onChange={handleDetailChange}
                  className="w-full px-3 py-2 rounded-md border border-border text-sm focus:ring-1 focus:ring-primary"
                />
                {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state}</p>}
              </div>
              <div>
                <label className="block text-xs text-textSecondary mb-1">City</label>
                <input
                  name="city"
                  value={details.city}
                  onChange={handleDetailChange}
                  className="w-full px-3 py-2 rounded-md border border-border text-sm focus:ring-1 focus:ring-primary"
                />
                {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
              </div>
            </div>
            <div>
              <label className="block text-xs text-textSecondary mb-1">Full Address</label>
              <textarea
                name="address"
                value={details.address}
                onChange={handleDetailChange}
                rows={3}
                className="w-full px-3 py-2 rounded-md border border-border text-sm focus:ring-1 focus:ring-primary"
              />
              {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-textSecondary mb-1">Pincode</label>
                <input
                  name="pincode"
                  value={details.pincode}
                  onChange={handleDetailChange}
                  className="w-full px-3 py-2 rounded-md border border-border text-sm focus:ring-1 focus:ring-primary"
                />
                {errors.pincode && <p className="text-xs text-red-500 mt-1">{errors.pincode}</p>}
              </div>
              <div>
                <label className="block text-xs text-textSecondary mb-1">Opening Time</label>
                <input
                  type="time"
                  name="opening_time"
                  value={details.opening_time}
                  onChange={handleDetailChange}
                  className="w-full px-3 py-2 rounded-md border border-border text-sm focus:ring-1 focus:ring-primary"
                />
                {errors.opening_time && <p className="text-xs text-red-500 mt-1">{errors.opening_time}</p>}
              </div>
              <div>
                <label className="block text-xs text-textSecondary mb-1">Closing Time</label>
                <input
                  type="time"
                  name="closing_time"
                  value={details.closing_time}
                  onChange={handleDetailChange}
                  className="w-full px-3 py-2 rounded-md border border-border text-sm focus:ring-1 focus:ring-primary"
                />
                {errors.closing_time && <p className="text-xs text-red-500 mt-1">{errors.closing_time}</p>}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-textSecondary mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={details.email}
                  onChange={handleDetailChange}
                  className="w-full px-3 py-2 rounded-md border border-border text-sm focus:ring-1 focus:ring-primary"
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-xs text-textSecondary mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  value={details.password}
                  onChange={handleDetailChange}
                  className="w-full px-3 py-2 rounded-md border border-border text-sm focus:ring-1 focus:ring-primary"
                />
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={() => {
                  if (validateStep1()) setStep(2)
                }}
                className="px-4 py-2 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90"
              >
                Next: Add Menu
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-textPrimary">Build Your Menu</h3>
              <button
                type="button"
                onClick={addCategory}
                className="px-3 py-1.5 rounded-md border border-border text-xs text-textSecondary hover:bg-slate-50"
              >
                + Add Category
              </button>
            </div>
            {categories.map((cat, ci) => (
              <div key={ci} className="border border-border rounded-lg p-4 mb-3 bg-surface">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    placeholder="Category name (e.g. Soups)"
                    value={cat.name}
                    onChange={(e) => handleCategoryName(ci, e.target.value)}
                    className="flex-1 px-3 py-2 rounded-md border border-border text-sm focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={() => removeCategory(ci)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                </div>
                {cat.items.map((item, ii) => (
                  <div key={ii} className="flex items-center gap-2 mb-2">
                    <input
                      placeholder="Item name"
                      value={item.name}
                      onChange={(e) => handleItemChange(ci, ii, 'name', e.target.value)}
                      className="flex-1 px-3 py-2 rounded-md border border-border text-sm focus:ring-1 focus:ring-primary"
                    />
                    <input
                      placeholder="Price"
                      type="number"
                      min="1"
                      value={item.price}
                      onChange={(e) => handleItemChange(ci, ii, 'price', e.target.value)}
                      className="w-28 px-3 py-2 rounded-md border border-border text-sm focus:ring-1 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(ci, ii)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addItem(ci)}
                  className="mt-2 text-xs text-primary hover:underline"
                >
                  + Add Item
                </button>
              </div>
            ))}
            {errors.categories && <p className="text-xs text-red-500 mt-1">{errors.categories}</p>}
            <div className="flex justify-between mt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-md border border-border text-sm text-textSecondary"
              >
                Back
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="px-4 py-2 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : 'Submit for Approval'}
              </button>
            </div>
          </div>
        )}

        <p className="text-xs text-textSecondary text-center mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline">Login</Link>
        </p>
      </div>
    </div>
  )
}

export default RestaurantRegisterPage

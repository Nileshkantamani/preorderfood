// frontend/src/pages/RestaurantProfilePage.jsx
import { useEffect, useState } from 'react'
import api from '../utils/api'
import Loader from '../components/Loader'
import Toast from '../components/Toast'
import { useNavigate } from 'react-router-dom'

const RestaurantProfilePage = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingMenu, setSavingMenu] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({
    restaurant_name: '',
    business_phone: '',
    state: '',
    city: '',
    address: '',
    pincode: '',
    opening_time: '',
    closing_time: '',
  })

  const [menu, setMenu] = useState({ categories: [] })
  const [showMenuEditor, setShowMenuEditor] = useState(false)

  useEffect(() => {
    const role = localStorage.getItem('auth_role')
    if (role !== 'restaurant') {
      navigate('/login')
      return
    }

    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/restaurant/profile')
        if (data.status === 'PENDING') {
          navigate('/restaurant/pending')
          return
        }
        if (data.status === 'REJECTED') {
          navigate('/restaurant/rejected')
          return
        }
        setProfile(data)
        setForm({
          restaurant_name: data.restaurant_name,
          business_phone: data.business_phone,
          state: data.state,
          city: data.city,
          address: data.address,
          pincode: data.pincode,
          opening_time: data.menu?.opening_time || '',
          closing_time: data.menu?.closing_time || '',
        })
        setMenu(data.menu || { categories: [] })
      } catch {
        setError('Failed to load profile.')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    setError('')
    setSuccess('')
    try {
      const { data } = await api.put('/restaurant/profile', form)
      setProfile(data)
      setSuccess('Profile updated successfully.')
    } catch {
      setError('Failed to update profile.')
    } finally {
      setSavingProfile(false)
    }
  }

  // Menu builder helpers
  const addCategory = () => {
    setMenu((prev) => ({
      categories: [...(prev.categories || []), { name: '', items: [] }],
    }))
  }

  const updateCategoryName = (index, value) => {
    setMenu((prev) => {
      const categories = [...(prev.categories || [])]
      categories[index] = { ...categories[index], name: value }
      return { ...prev, categories }
    })
  }

  const deleteCategory = (index) => {
    setMenu((prev) => {
      const categories = [...(prev.categories || [])]
      categories.splice(index, 1)
      return { ...prev, categories }
    })
  }

  const addItem = (catIndex) => {
    setMenu((prev) => {
      const categories = [...(prev.categories || [])]
      const cat = categories[catIndex]
      const items = [...(cat.items || []), { name: '', price: 0 }]
      categories[catIndex] = { ...cat, items }
      return { ...prev, categories }
    })
  }

  const updateItem = (catIndex, itemIndex, field, value) => {
    setMenu((prev) => {
      const categories = [...(prev.categories || [])]
      const cat = categories[catIndex]
      const items = [...(cat.items || [])]
      const item = { ...items[itemIndex], [field]: field === 'price' ? Number(value) || 0 : value }
      items[itemIndex] = item
      categories[catIndex] = { ...cat, items }
      return { ...prev, categories }
    })
  }

  const deleteItem = (catIndex, itemIndex) => {
    setMenu((prev) => {
      const categories = [...(prev.categories || [])]
      const cat = categories[catIndex]
      const items = [...(cat.items || [])]
      items.splice(itemIndex, 1)
      categories[catIndex] = { ...cat, items }
      return { ...prev, categories }
    })
  }

  const handleSaveMenu = async () => {
    setSavingMenu(true)
    setError('')
    setSuccess('')
    try {
      const { data } = await api.put('/restaurant/menu', { menu })
      setProfile(data)
      setMenu(data.menu || { categories: [] })
      setSuccess('Menu updated successfully.')
      setShowMenuEditor(false)
    } catch {
      setError('Failed to update menu.')
    } finally {
      setSavingMenu(false)
    }
  }

  if (loading) return <Loader text="Loading profile..." />

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Toast message={error || success} onClose={() => { setError(''); setSuccess('') }} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: profile + menu */}
        <div className="md:col-span-2 space-y-6">
          <form
            onSubmit={handleUpdateProfile}
            className="bg-surface border border-border rounded-lg p-6 shadow-sm"
          >
            <h1 className="text-lg font-semibold text-textPrimary mb-4">
              Restaurant Profile
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[11px] text-textSecondary mb-1">
                  Restaurant Name
                </label>
                <input
                  name="restaurant_name"
                  value={form.restaurant_name}
                  onChange={handleChange}
                  className="w-full border border-border rounded-md px-3 py-2 text-xs bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-[11px] text-textSecondary mb-1">
                  Business Phone
                </label>
                <input
                  name="business_phone"
                  value={form.business_phone}
                  onChange={handleChange}
                  className="w-full border border-border rounded-md px-3 py-2 text-xs bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] text-textSecondary mb-1">State</label>
                <input
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  className="w-full border border-border rounded-md px-3 py-2 text-xs bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-[11px] text-textSecondary mb-1">City</label>
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className="w-full border border-border rounded-md px-3 py-2 text-xs bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] text-textSecondary mb-1">
                  Full Address
                </label>
                <textarea
                  name="address"
                  rows={3}
                  value={form.address}
                  onChange={handleChange}
                  className="w-full border border-border rounded-md px-3 py-2 text-xs bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] text-textSecondary mb-1">
                  Pincode
                </label>
                <input
                  name="pincode"
                  value={form.pincode}
                  onChange={handleChange}
                  className="w-full border border-border rounded-md px-3 py-2 text-xs bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] text-textSecondary mb-1">
                  Opening Time
                </label>
                <input
                  type="time"
                  name="opening_time"
                  value={form.opening_time}
                  onChange={handleChange}
                  className="w-full border border-border rounded-md px-3 py-2 text-xs bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-[11px] text-textSecondary mb-1">
                  Closing Time
                </label>
                <input
                  type="time"
                  name="closing_time"
                  value={form.closing_time}
                  onChange={handleChange}
                  className="w-full border border-border rounded-md px-3 py-2 text-xs bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-4 py-2 text-xs font-medium rounded-md bg-primary text-white hover:bg-primary/90 disabled:opacity-60"
              >
                {savingProfile ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
          </form>

          <div className="bg-surface border border-border rounded-lg p-6 shadow-sm text-xs">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-textPrimary">Your Menu</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowMenuEditor(true)}
                  className="px-3 py-1 rounded-md border border-border text-[11px] text-textSecondary hover:bg-slate-50"
                >
                  Edit Menu
                </button>
              </div>
            </div>

            {menu.categories && menu.categories.length > 0 ? (
              <div className="space-y-2">
                {menu.categories.map((cat, idx) => (
                  <div key={idx} className="border border-border rounded-md p-3">
                    <p className="text-xs font-semibold text-textPrimary mb-1">
                      {cat.name || 'Untitled Category'}
                    </p>
                    <ul className="text-[11px] text-textSecondary list-disc pl-4">
                      {(cat.items || []).map((item, j) => (
                        <li key={j}>
                          {item.name} - ₹{item.price}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-textSecondary">No menu configured yet.</p>
            )}
          </div>
        </div>

        {/* Right column: statistics */}
        <div className="space-y-4 text-xs">
          <div className="bg-surface border border-border rounded-lg p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-textPrimary mb-2">
              Your Statistics
            </h2>
            <p>Total Orders: {profile.orders_count}</p>
            <p>Pending Orders: {profile.pending_orders}</p>
            <p>Accepted Orders: {profile.accepted_orders}</p>
            <p>Rejected Orders: {profile.rejected_orders}</p>
            <p>Completed Orders: {profile.completed_orders}</p>
            <div className="h-px bg-border my-2" />
            <p>Total Revenue: ₹{profile.revenue}</p>
            <p>Average Order: ₹{Math.round(profile.average_order_value)}</p>
            <div className="h-px bg-border my-2" />
            <p>Acceptance Rate: {profile.acceptance_rate.toFixed(1)}%</p>
            <p>
              Member Since:{' '}
              {profile.member_since && new Date(profile.member_since).toLocaleDateString()}
            </p>
          </div>

          <div className="bg-surface border border-border rounded-lg p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-textPrimary mb-2">
              Recent Orders
            </h2>
            <p className="text-[11px] text-textSecondary mb-2">
              For detailed history, go to your orders page.
            </p>
            <button
              onClick={() => navigate('/restaurant/orders')}
              className="mt-1 px-3 py-1 text-[11px] font-medium rounded-md border border-border text-textSecondary hover:bg-slate-50"
            >
              View All Orders
            </button>
          </div>

          <div className="bg-surface border border-border rounded-lg p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-textPrimary mb-2">
              Account Status
            </h2>
            <p>
              Account Status:{' '}
              <span className="font-semibold text-emerald-600">Active</span>
            </p>
            <p>Listed: Yes</p>
            <p>Accepting Orders: {profile.status === 'APPROVED' ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>

      {/* Menu Editor Modal */}
      {showMenuEditor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
          <div className="bg-surface border border-border rounded-lg p-5 max-w-2xl w-full max-h-[80vh] overflow-y-auto text-xs">
            <h2 className="text-sm font-semibold text-textPrimary mb-3">Edit Menu</h2>

            <button
              type="button"
              onClick={addCategory}
              className="mb-3 px-3 py-1 rounded-md border border-border text-[11px] text-textSecondary hover:bg-slate-50"
            >
              + Add Category
            </button>

            <div className="space-y-3">
              {(menu.categories || []).map((cat, catIdx) => (
                <div key={catIdx} className="border border-border rounded-md p-3">
                  <div className="flex justify-between items-center mb-2">
                    <input
                      value={cat.name}
                      onChange={(e) => updateCategoryName(catIdx, e.target.value)}
                      placeholder="Category name"
                      className="flex-1 border border-border rounded-md px-2 py-1 text-[11px] bg-surface focus:outline-none focus:ring-1 focus:ring-primary mr-2"
                    />
                    <button
                      type="button"
                      onClick={() => deleteCategory(catIdx)}
                      className="px-2 py-1 text-[11px] rounded-md border border-red-500 text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="space-y-1 mb-2">
                    {(cat.items || []).map((item, itemIdx) => (
                      <div
                        key={itemIdx}
                        className="flex items-center gap-2 text-[11px]"
                      >
                        <input
                          value={item.name}
                          onChange={(e) => updateItem(catIdx, itemIdx, 'name', e.target.value)}
                          placeholder="Item name"
                          className="flex-1 border border-border rounded-md px-2 py-1 bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => updateItem(catIdx, itemIdx, 'price', e.target.value)}
                          placeholder="Price"
                          className="w-20 border border-border rounded-md px-2 py-1 bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <button
                          type="button"
                          onClick={() => deleteItem(catIdx, itemIdx)}
                          className="px-2 py-1 text-[11px] rounded-md border border-border text-textSecondary hover:bg-slate-50"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => addItem(catIdx)}
                    className="mt-1 px-3 py-1 text-[11px] rounded-md border border-border text-textSecondary hover:bg-slate-50"
                  >
                    + Add Item
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 mt-4 text-[11px]">
              <button
                type="button"
                onClick={() => setShowMenuEditor(false)}
                className="px-3 py-1 rounded-md border border-border text-textSecondary hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingMenu}
                onClick={handleSaveMenu}
                className="px-3 py-1 rounded-md bg-primary text-white hover:bg-primary/90 disabled:opacity-60"
              >
                {savingMenu ? 'Saving...' : 'Save Menu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RestaurantProfilePage

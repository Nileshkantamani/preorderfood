import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../utils/api'

const AdminRestaurantPage = () => {
  const { restaurantId } = useParams()
  const navigate = useNavigate()
  const [restaurant, setRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [menu, setMenu] = useState({ categories: [] })
  const [savingMenu, setSavingMenu] = useState(false)

  useEffect(() => {
    const role = localStorage.getItem('auth_role')
    if (role !== 'admin') {
      navigate('/admin/login')
      return
    }
    const fetchDetail = async () => {
      try {
        const { data } = await api.get(`/admin/restaurants/${restaurantId}`)
        setRestaurant(data)
        setMenu(data.menu || { categories: [] })
      } catch (err) {
        setError('Failed to load restaurant details.')
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [restaurantId, navigate])

  const handleApprove = async () => {
    setSubmitting(true)
    try {
      await api.post(`/admin/approve/${restaurantId}`)
      navigate('/admin/dashboard')
    } catch (err) {
      setError('Failed to approve restaurant.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveMenu = async () => {
    setSavingMenu(true)
    setError('')
    try {
      const { data } = await api.put(`/admin/restaurants/${restaurantId}/menu`, { menu })
      setRestaurant(data)
      setMenu(data.menu || { categories: [] })
    } catch (err) {
      setError('Failed to save menu.')
    } finally {
      setSavingMenu(false)
    }
  }

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
      const item = {
        ...items[itemIndex],
        [field]: field === 'price' ? Number(value) || 0 : value,
      }
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

  const handleReject = async () => {
    if (!rejectReason || rejectReason.trim().length < 3) {
      setError('Please provide a short reason for rejection.')
      return
    }
    setSubmitting(true)
    try {
      await api.post(`/admin/reject/${restaurantId}`, { reason: rejectReason })
      navigate('/admin/dashboard')
    } catch (err) {
      setError('Failed to reject restaurant.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-sm text-textSecondary">Loading restaurant...</p>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-sm text-red-500">Restaurant not found.</p>
      </div>
    )
  }

  const { restaurant_name, business_phone, address, city, state, pincode, opening_time, closing_time, status } =
    restaurant

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-textPrimary">{restaurant_name}</h1>
          <p className="text-xs text-textSecondary">
            {city}, {state} • {business_phone}
          </p>
          <p className="text-xs text-textSecondary mt-1">
            {address}, {pincode}
          </p>
          <p className="text-xs text-textSecondary mt-1">
            Hours: {opening_time} – {closing_time}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-textSecondary uppercase">Status</p>
          <p className="text-sm font-medium">{status}</p>
        </div>
      </div>

      <div className="border border-border rounded-md bg-surface p-4">
        <h2 className="text-sm font-semibold text-textPrimary mb-2">Menu</h2>
        <button
          type="button"
          onClick={addCategory}
          className="mb-3 px-3 py-1 rounded-md border border-border text-[11px] text-textSecondary hover:bg-slate-50"
        >
          + Add Category
        </button>

        {(menu.categories || []).length === 0 ? (
          <p className="text-xs text-textSecondary">No categories yet. Add one to start building the menu.</p>
        ) : (
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
                    Remove
                  </button>
                </div>

                <div className="space-y-2">
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
                        min={0}
                        value={item.price}
                        onChange={(e) => updateItem(catIdx, itemIdx, 'price', e.target.value)}
                        placeholder="Price"
                        className="w-24 border border-border rounded-md px-2 py-1 bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => deleteItem(catIdx, itemIdx)}
                        className="px-2 py-1 text-[11px] rounded-md border border-red-500 text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => addItem(catIdx)}
                  className="mt-2 px-3 py-1 rounded-md border border-border text-[11px] text-textSecondary hover:bg-slate-50"
                >
                  + Add Item
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end mt-3">
          <button
            type="button"
            onClick={handleSaveMenu}
            disabled={savingMenu}
            className="px-4 py-1.5 text-xs rounded-md border border-border text-textSecondary hover:bg-slate-50 disabled:opacity-60"
          >
            {savingMenu ? 'Saving menu...' : 'Save Menu'}
          </button>
        </div>
      </div>

      <div className="border border-border rounded-md bg-surface p-4 space-y-2">
        <label className="block text-xs text-textSecondary mb-1">
          Rejection reason (required if rejecting)
        </label>
        <textarea
          rows={3}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            disabled={submitting}
            onClick={handleReject}
            className="px-4 py-2 text-xs font-medium rounded-md border border-red-500 text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            Reject
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleApprove}
            className="px-4 py-2 text-xs font-medium rounded-md bg-primary text-white hover:bg-primary/90 disabled:opacity-60"
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminRestaurantPage

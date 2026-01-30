// frontend/src/pages/CustomerRestaurantPage.jsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../utils/api'
import Loader from '../components/Loader'
import Toast from '../components/Toast'

const CustomerRestaurantPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [restaurant, setRestaurant] = useState(null)
  const [menu, setMenu] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [arrivalTime, setArrivalTime] = useState('')
  const [people, setPeople] = useState(2)
  const [selected, setSelected] = useState({}) // key: item name, value: quantity
  const [placing, setPlacing] = useState(false)
  const [ratings, setRatings] = useState(null)

  useEffect(() => {
    const role = localStorage.getItem('auth_role')
    if (role !== 'customer') {
      navigate('/login')
      return
    }
    const fetchData = async () => {
      try {
        const [restRes, menuRes, ratingsRes] = await Promise.all([
          api.get(`/restaurants/${id}`),
          api.get(`/menu/${id}`),
          api.get(`/restaurants/${id}/ratings`),
        ])
        setRestaurant(restRes.data)
        setMenu(menuRes.data)
        setRatings(ratingsRes.data)
      } catch {
        setError('Failed to load restaurant or menu.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id, navigate])

  const handleToggleItem = (itemName) => {
    setSelected((prev) => {
      const next = { ...prev }
      if (next[itemName]) {
        delete next[itemName]
      } else {
        next[itemName] = 1
      }
      return next
    })
  }

  const handleQuantityChange = (itemName, qty) => {
    setSelected((prev) => ({ ...prev, [itemName]: qty }))
  }

  const itemsList = useMemo(() => {
    if (!menu?.categories) return []
    const all = []
    menu.categories.forEach((cat) => {
      cat.items.forEach((it) => {
        all.push({ category: cat.name, name: it.name, price: it.price })
      })
    })
    return all
  }, [menu])

  const cartItems = useMemo(
    () =>
      itemsList
        .filter((it) => selected[it.name])
        .map((it) => ({
          ...it,
          quantity: selected[it.name],
          subtotal: it.price * selected[it.name],
        })),
    [itemsList, selected]
  )

  const subtotal = useMemo(
    () => cartItems.reduce((sum, it) => sum + it.subtotal, 0),
    [cartItems]
  )
  const tax = Math.round(subtotal * 0.05)
  const total = subtotal + tax

  const validate = () => {
    if (!arrivalTime) {
      setError('Please select an arrival time.')
      return false
    }
    if (cartItems.length === 0) {
      setError('Please select at least one menu item.')
      return false
    }
    if (people < 1 || people > 20) {
      setError('Number of people must be between 1 and 20.')
      return false
    }
    return true
  }

  const handlePlaceOrder = async () => {
    if (!validate()) return
    setPlacing(true)
    setError('')
    try {
      const payload = {
        restaurant_id: Number(id),
        arrival_time: arrivalTime,
        people,
        items: cartItems.map((it) => ({
          item_name: it.name,
          quantity: it.quantity,
          price: it.price,
        })),
        total,
      }
      const { data } = await api.post('/order', payload)
      const orderId = data.order_id
      navigate(`/customer/payment/${orderId}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to place order.')
    } finally {
      setPlacing(false)
    }
  }

  if (loading) return <Loader text="Loading restaurant..." />

  if (!restaurant) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Toast message={error || 'Restaurant not found.'} onClose={() => setError('')} />
        <p className="text-sm text-red-500">Restaurant not found.</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 grid gap-8 md:grid-cols-[2fr,1.5fr]">
      <Toast message={error} onClose={() => setError('')} />

      {/* Left column: info + order details */}
      <div className="space-y-4">
        <div className="bg-surface border border-border rounded-md p-4">
          <h2 className="text-xl font-semibold text-textPrimary mb-1">
            {restaurant.restaurant_name}
          </h2>
          <p className="text-xs text-textSecondary">
            {restaurant.address}, {restaurant.city}, {restaurant.state} - {restaurant.pincode}
          </p>
          <p className="text-xs text-textSecondary mt-1">
            Phone: {restaurant.business_phone}
          </p>
          <p className="text-xs text-textSecondary mt-1">
            Hours: {restaurant.opening_time} – {restaurant.closing_time}
          </p>
        </div>

        <div className="bg-surface border border-border rounded-md p-4 space-y-3">
          <div>
            <label className="block text-xs text-textSecondary mb-1">
              Arrival Time
            </label>
            <input
              type="datetime-local"
              value={arrivalTime}
              onChange={(e) => setArrivalTime(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-textSecondary mb-1">
              Number of People
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={people}
              onChange={(e) => setPeople(Number(e.target.value || 1))}
              className="w-28 px-3 py-2 text-sm border border-border rounded-md bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="bg-surface border border-border rounded-md p-4">
          <h3 className="text-sm font-semibold text-textPrimary mb-2">Menu</h3>
          {menu?.categories?.length ? (
            <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
              {menu.categories.map((cat) => (
                <div key={cat.name}>
                  <p className="text-sm font-medium text-textPrimary mb-1">
                    {cat.name}
                  </p>
                  <div className="space-y-2">
                    {cat.items.map((item) => {
                      const checked = Boolean(selected[item.name])
                      return (
                        <div
                          key={item.name}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleToggleItem(item.name)}
                            />
                            <span>{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-textSecondary">
                              ₹{item.price}
                            </span>
                            <select
                              disabled={!checked}
                              value={selected[item.name] || 1}
                              onChange={(e) =>
                                handleQuantityChange(
                                  item.name,
                                  Number(e.target.value)
                                )
                              }
                              className="px-2 py-1 text-xs border border-border rounded-md bg-surface disabled:opacity-50"
                            >
                              {Array.from({ length: 10 }).map((_, i) => (
                                <option key={i + 1} value={i + 1}>
                                  {i + 1}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-textSecondary">No menu available.</p>
          )}
        </div>
      </div>

      {/* Right column: cart summary */}
      <div className="md:sticky md:top-20 space-y-4">
        <div className="bg-surface border border-border rounded-md p-4">
          <h3 className="text-sm font-semibold text-textPrimary mb-2">
            Your Order
          </h3>
          {cartItems.length === 0 ? (
            <p className="text-xs text-textSecondary">
              No items selected yet.
            </p>
          ) : (
            <>
              <ul className="text-xs text-textSecondary space-y-1 mb-3">
                {cartItems.map((it) => (
                  <li key={it.name} className="flex justify-between">
                    <span>
                      {it.name} (x{it.quantity})
                    </span>
                    <span>₹{it.subtotal}</span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-border pt-2 text-xs text-textSecondary space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (5%)</span>
                  <span>₹{tax}</span>
                </div>
                <div className="flex justify-between font-semibold text-textPrimary">
                  <span>Total</span>
                  <span>₹{total}</span>
                </div>
              </div>
            </>
          )}
          <button
            disabled={placing || cartItems.length === 0}
            onClick={handlePlaceOrder}
            className="mt-4 w-full px-4 py-2 text-sm font-medium rounded-md bg-primary text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {placing ? 'Placing order...' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CustomerRestaurantPage
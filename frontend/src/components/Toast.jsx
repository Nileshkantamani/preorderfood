import { useEffect } from 'react'

const Toast = ({ message, type = 'error', onClose }) => {
  useEffect(() => {
    if (!message) return
    const id = setTimeout(() => {
      onClose?.()
    }, 3000)
    return () => clearTimeout(id)
  }, [message, onClose])

  if (!message) return null

  const base = 'fixed top-4 right-4 px-4 py-2 rounded-md shadow text-sm z-50'
  const color = type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'

  return <div className={`${base} ${color}`}>{message}</div>
}

export default Toast

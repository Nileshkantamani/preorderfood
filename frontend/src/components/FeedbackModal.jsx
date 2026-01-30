import React, { useState, useEffect } from 'react'
import StarRating from './StarRating'

const FeedbackModal = ({
  open,
  onClose,
  onSubmit,
  initialValue,
  readOnly = false,
}) => {
  const [restaurantRating, setRestaurantRating] = useState(0)
  const [foodRating, setFoodRating] = useState(0)
  const [comment, setComment] = useState('')

  useEffect(() => {
    if (initialValue) {
      setRestaurantRating(initialValue.restaurant_rating || 0)
      setFoodRating(initialValue.food_rating || 0)
      setComment(initialValue.comment || '')
    } else {
      setRestaurantRating(0)
      setFoodRating(0)
      setComment('')
    }
  }, [initialValue, open])

  if (!open) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (readOnly) {
      onClose?.()
      return
    }
    onSubmit?.({ restaurant_rating: restaurantRating, food_rating: foodRating, comment })
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20">
      <div className="bg-surface border border-border rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-textPrimary">
            {readOnly ? 'Your Feedback' : 'Rate Your Experience'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-textSecondary hover:text-textPrimary"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4 text-sm">
          <div>
            <p className="text-xs font-medium text-textPrimary mb-1">Restaurant Rating</p>
            <StarRating
              value={restaurantRating}
              onChange={setRestaurantRating}
              readOnly={readOnly}
            />
          </div>

          <div>
            <p className="text-xs font-medium text-textPrimary mb-1">Food Rating</p>
            <StarRating value={foodRating} onChange={setFoodRating} readOnly={readOnly} />
          </div>

          <div>
            <label className="block text-xs font-medium text-textPrimary mb-1">
              Comment (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              disabled={readOnly}
              className="w-full px-3 py-2 text-xs border border-border rounded-md bg-surface focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-70"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-border text-textSecondary hover:bg-slate-50"
            >
              {readOnly ? 'Close' : 'Cancel'}
            </button>
            {!readOnly && (
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-medium rounded-md border border-border text-textPrimary hover:bg-slate-50"
              >
                Submit Feedback
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default FeedbackModal

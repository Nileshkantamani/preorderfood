import React from 'react'

const StarRating = ({ value = 0, onChange, readOnly = false, size = 16 }) => {
  const handleClick = (index) => {
    if (readOnly || !onChange) return
    onChange(index + 1)
  }

  const handleKeyDown = (event, index) => {
    if (readOnly || !onChange) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onChange(index + 1)
    }
  }

  return (
    <div className="inline-flex items-center gap-1" aria-label="Rating">
      {Array.from({ length: 5 }).map((_, index) => {
        const filled = index < value
        return (
          <button
            key={index}
            type="button"
            className="p-0 border-0 bg-transparent cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary rounded-sm"
            onClick={() => handleClick(index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            disabled={readOnly}
            aria-label={`Rate ${index + 1} star${index === 0 ? '' : 's'}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill={filled ? '#eab308' : 'none'}
              stroke={filled ? '#eab308' : '#9ca3af'}
              className="transition-colors"
              style={{ width: size, height: size }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
              />
            </svg>
          </button>
        )
      })}
    </div>
  )
}

export default StarRating

const Card = ({ className = '', children }) => {
  return (
    <div className={`bg-surface border border-border rounded-lg p-4 shadow-sm ${className}`}>
      {children}
    </div>
  )
}

export default Card

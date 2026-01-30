const Loader = ({ text = 'Loading...' }) => (
  <div className="w-full flex justify-center py-8">
    <div className="inline-flex items-center gap-2 text-sm text-textSecondary">
      <span className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <span>{text}</span>
    </div>
  </div>
)

export default Loader

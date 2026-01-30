const Footer = () => {
  return (
    <footer className="border-t border-border bg-surface text-xs text-textSecondary">
      <div className="max-w-6xl mx-auto flex items-center justify-center py-4 px-4">
        <p>© {new Date().getFullYear()} PreOrderFood. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer

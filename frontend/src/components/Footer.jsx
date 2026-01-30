const Footer = () => {
  return (
    <footer className="border-t border-border bg-surface text-xs text-textSecondary">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 py-4 px-4">
        <p>© {new Date().getFullYear()} PreOrderFood. All rights reserved.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-primary">
            About
          </a>
          <a href="#" className="hover:text-primary">
            Contact
          </a>
          <a href="#" className="hover:text-primary">
            Privacy
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer

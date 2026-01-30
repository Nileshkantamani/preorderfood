import Navbar from './Navbar'
import Footer from './Footer'

const Layout = ({ children, footer = true }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">{children}</main>
      {footer && <Footer />}
    </div>
  )
}

export default Layout

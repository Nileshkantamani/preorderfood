import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import RegisterPage from './pages/RegisterPage'
import CustomerRegisterPage from './pages/CustomerRegisterPage'
import RestaurantRegisterPage from './pages/RestaurantRegisterPage'
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminUserDetailPage from './pages/AdminUserDetailPage'
import AdminRestaurantPage from './pages/AdminRestaurantPage'
import CustomerHomePage from './pages/CustomerHomePage'
import CustomerRestaurantPage from './pages/CustomerRestaurantPage'
import CustomerOrdersPage from './pages/CustomerOrderPage'
import CustomerOrderDetailPage from './pages/CustomerOrderDetailPage'
import CustomerPaymentPage from './pages/CustomerPaymentPage'
import CustomerProfilePage from './pages/CustomerProfilePage'
import RestaurantDashboardPage from './pages/RestaurantDashboardPage'
import RestaurantProfilePage from './pages/RestaurantProfilePage'
import RestaurantPendingPage from './pages/RestaurantPendingPage'
import RestaurantRejectedPage from './pages/RestaurantRejectedPage'
import RestaurantOrdersPage from './pages/RestaurantOrdersPage'
import RestaurantOrderPage from './pages/RestaurantOrderPage'

const App = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register/customer" element={<CustomerRegisterPage />} />
        <Route path="/register/restaurant" element={<RestaurantRegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/restaurant/:restaurantId" element={<AdminRestaurantPage />} />
        <Route path="/admin/users/:userId" element={<AdminUserDetailPage />} />

        <Route path="/customer/home" element={<CustomerHomePage />} />
        <Route path="/customer/restaurant/:id" element={<CustomerRestaurantPage />} />
        <Route path="/customer/orders" element={<CustomerOrdersPage />} />
        <Route path="/customer/order/:id" element={<CustomerOrderDetailPage />} />
        <Route path="/customer/payment/:orderId" element={<CustomerPaymentPage />} />
        <Route path="/customer/profile" element={<CustomerProfilePage />} />

        <Route path="/restaurant/dashboard" element={<RestaurantDashboardPage />} />
        <Route path="/restaurant/profile" element={<RestaurantProfilePage />} />
        <Route path="/restaurant/pending" element={<RestaurantPendingPage />} />
        <Route path="/restaurant/rejected" element={<RestaurantRejectedPage />} />
        <Route path="/restaurant/orders" element={<RestaurantOrdersPage />} />
        <Route path="/restaurant/order/:id" element={<RestaurantOrderPage />} />
      </Routes>
    </Layout>
  )
}

export default App
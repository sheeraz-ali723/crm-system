import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import DashboardLayout from "./components/layout/DashboardLayout";

import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import Invoices from "./pages/Invoices";
import Analytics from "./pages/Analytics";
import AIAssistant from "./pages/AIAssistant";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ProtectedRoute from "./components/ProtectedRoute";
import Leads from "./pages/Leads";
import Deals from "./pages/Deals";
import Tasks from "./pages/Tasks";
import Activities from "./pages/Activities";
import Notifications from "./pages/Notifications";







function App() {
  return (
    <BrowserRouter>
      <DashboardLayout>
        <Routes>

          {/* ========================= */}
          {/* Public Routes */}
          {/* ========================= */}

          <Route path="/login" element={<Login />} />

          <Route path="/signup" element={<Signup />} />


          {/* ========================= */}
          {/* Protected Routes */}
          {/* ========================= */}

          <Route element={<ProtectedRoute />}>

            {/* Dashboard */}
            <Route path="/" element={<Dashboard />} />

            <Route path="/dashboard" element={<Dashboard />} />

            {/* Customers */}
            <Route path="/customers" element={<Customers />} />

            {/* Leads */}
            <Route path="/leads" element={<Leads />} />

            {/* Products */}
            <Route path="/products" element={<Products />} />

            {/* Orders */}
            <Route path="/orders" element={<Orders />} />

            {/* Invoices */}
            <Route path="/invoices" element={<Invoices />} />

            {/* Analytics */}
            <Route path="/analytics" element={<Analytics />} />

            {/* AI Assistant */}
            <Route path="/ai-assistant" element={<AIAssistant />} />

            {/* Settings */}
            <Route path="/settings" element={<Settings />} />
           <Route path="/deals" element={<Deals />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/notifications" element={<Notifications />} /> 



            
          </Route>

        </Routes>
      </DashboardLayout>
    </BrowserRouter>
  );
}

export default App;
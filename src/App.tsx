import { HashRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ElectricCharges from './pages/ElectricCharges'
import FuelRefuels from './pages/FuelRefuels'
import Statistics from './pages/Statistics'
import Settings from './pages/Settings'
import Tires from './pages/Tires'
import InsurancePage from './pages/Insurance'
import Garage from './pages/Garage'

function AppRoutes() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) return <Login />

  return (
    <DataProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="recargas" element={<ElectricCharges />} />
          <Route path="repostajes" element={<FuelRefuels />} />
          <Route path="estadisticas" element={<Statistics />} />
          <Route path="neumaticos" element={<Tires />} />
          <Route path="taller" element={<Garage />} />
          <Route path="seguro" element={<InsurancePage />} />
          <Route path="configuracion" element={<Settings />} />
        </Route>
      </Routes>
    </DataProvider>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </HashRouter>
    </ThemeProvider>
  )
}

import { HashRouter, Routes, Route } from 'react-router-dom'
import { DataProvider } from './context/DataContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import ElectricCharges from './pages/ElectricCharges'
import FuelRefuels from './pages/FuelRefuels'
import Statistics from './pages/Statistics'
import Settings from './pages/Settings'

export default function App() {
  return (
    <DataProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="recargas" element={<ElectricCharges />} />
            <Route path="repostajes" element={<FuelRefuels />} />
            <Route path="estadisticas" element={<Statistics />} />
            <Route path="configuracion" element={<Settings />} />
          </Route>
        </Routes>
      </HashRouter>
    </DataProvider>
  )
}

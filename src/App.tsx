import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout, GuestOnly, MarketShell, Protected } from './components/Layouts'
import { AuthProvider } from './lib/auth'
import { ThemeProvider } from './lib/theme'
import Alerts from './pages/Alerts'
import { Login, Register } from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Market from './pages/Market'
import Trades from './pages/Trades'
import Watchlist from './pages/Watchlist'

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route element={<GuestOnly />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            <Route element={<Protected />}>
              <Route element={<AppLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="/watchlist" element={<Watchlist />} />
                <Route path="/trades" element={<Trades />} />
                <Route path="/alerts" element={<Alerts />} />
              </Route>
            </Route>

            <Route path="/market" element={<MarketShell />}>
              <Route index element={<Market />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

import Sidebar from './Sidebar'
import BottomNav from './BottomNav'

export default function Layout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar — hidden on mobile, visible on md+ */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main content — extra bottom padding on mobile for the bottom nav */}
      <main className="flex-1 overflow-y-auto bg-slate-50 pb-20 md:pb-0">
        {children}
      </main>

      {/* Bottom nav — visible on mobile only */}
      <BottomNav />
    </div>
  )
}

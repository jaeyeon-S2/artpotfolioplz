import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { AdminEditButton } from '@/components/admin-edit-button'

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider defaultOpen={false} style={{ "--sidebar-width": "240px", "--sidebar-width-mobile": "240px" } as React.CSSProperties}>
      <AppSidebar />
      <SidebarInset className="bg-transparent">
        <header className="flex h-14 items-center justify-between gap-4 px-6 fixed top-0 left-0 right-0 z-50 pointer-events-none">
          <div className="pointer-events-auto">
            <SidebarTrigger
              className="bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-md"
              style={{ cursor: "url('/E.webp'), auto" }}
            />
          </div>
          <div className="pointer-events-auto">
            <AdminEditButton />
          </div>
        </header>
        <main className="flex-1 overflow-auto pt-14">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

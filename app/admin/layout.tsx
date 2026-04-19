import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies()
  const authCookie = cookieStore.get('admin_auth')

  if (!authCookie || authCookie.value !== process.env.ADMIN_SECRET) {
    redirect('/admin/login')
  }

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Sidebar */}
      <aside className="w-56 bg-sea-dark flex flex-col py-8 px-4 gap-2 flex-shrink-0">
        <div className="font-display font-black text-2xl text-cyan-brand tracking-tight px-2 mb-6">
          Q4 ADMIN
        </div>

        <NavLink href="/admin" exact>Dashboard</NavLink>
        <NavLink href="/admin/members">Members</NavLink>
        <NavLink href="/admin/attendance">Attendance</NavLink>

        <div className="flex-1" />

        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-white/40 text-sm hover:text-white/70 transition-colors"
        >
          ← Kiosk
        </Link>

        <form action="/api/admin/logout" method="POST">
          <button
            type="submit"
            className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-xl text-white/40 text-sm hover:text-white/70 transition-colors"
          >
            Log out
          </button>
        </form>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}

function NavLink({
  href,
  children,
  exact = false,
}: {
  href: string
  children: React.ReactNode
  exact?: boolean
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-white/70 text-sm font-display font-semibold hover:bg-white/10 hover:text-white transition-all"
    >
      {children}
    </Link>
  )
}

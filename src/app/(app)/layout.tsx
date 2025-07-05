import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AppClientLayout } from '@/components/app/app-client-layout'
import { type ReactNode } from 'react'

export default function AppLayout({ children }: { children: ReactNode }) {
  const cookieStore = cookies()
  const role = cookieStore.get('user_role')?.value

  if (!role || !['administrator', 'instructor', 'student'].includes(role)) {
    redirect('/')
  }

  return (
    <AppClientLayout role={role}>
      {children}
    </AppClientLayout>
  )
}

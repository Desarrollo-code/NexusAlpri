import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default function Dashboard() {
  const cookieStore = cookies()
  const role = cookieStore.get('user_role')?.value

  if (role === 'administrator') {
    redirect('/dashboard/admin')
  } else if (role === 'instructor') {
    redirect('/dashboard/instructor')
  } else {
    redirect('/dashboard/student')
  }

  return null
}

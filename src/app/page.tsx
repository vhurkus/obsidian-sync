import { redirect } from 'next/navigation'

export default function Home() {
  // This page should redirect, but middleware will handle it
  // This is a fallback in case middleware doesn't work
  redirect('/auth/login')
}

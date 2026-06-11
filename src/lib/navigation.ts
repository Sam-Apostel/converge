import {
  CalendarClock,
  Home,
  Mail,
  MapPin,
  MessagesSquare,
  Rocket,
  Sparkles,
  User,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
}

/** Primary navigation — mirrors the Converge information architecture. */
export const navItems: Array<NavItem> = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/sessions', label: 'Sessions', icon: CalendarClock },
  { to: '/people', label: 'People', icon: Users },
  { to: '/projects', label: 'Projects', icon: Rocket },
  { to: '/discussions', label: 'Discussions', icon: MessagesSquare },
  { to: '/messages', label: 'Messages', icon: Mail },
  { to: '/concierge', label: 'AI Concierge', icon: Sparkles },
  { to: '/venue', label: 'Venue', icon: MapPin },
  { to: '/profile', label: 'Profile', icon: User },
]

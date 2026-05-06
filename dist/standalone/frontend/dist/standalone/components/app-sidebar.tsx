'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { BookOpen, Palette, Heart, MessageSquare } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const menuItems = [
  {
    title: '웹툰 기획',
    href: '/webtoon',
    icon: BookOpen,
    openInNewTab: false,
  },
  {
    title: '작업물',
    href: '/works',
    icon: Palette,
    openInNewTab: false,
  },
  {
    title: '개인작',
    href: '/personal',
    icon: Heart,
    openInNewTab: false,
  },
  {
    title: '방명록',
    href: '/guestbook',
    icon: MessageSquare,
    openInNewTab: false,
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar variant="sidebar" collapsible="offcanvas" className="border-r border-sidebar-border bg-white/10 backdrop-blur-xl">
      <SidebarContent className="p-4 pt-12">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
                    className="h-12 px-4 rounded-xl transition-all hover:scale-[1.02]"
                  >
                    <Link
                      href={item.href}
                      target={item.openInNewTab ? '_blank' : undefined}
                      rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
                    >
                      <item.icon className="size-5" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

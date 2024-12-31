import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar
} from '@/components/ui/sidebar';
import { Home, Workflow } from 'lucide-react';
import { type PropsWithChildren } from 'react';

const items = [
  {
    title: 'Pipelines',
    url: '/gitlab/pipelines',
    icon: Workflow
  }
];

export function AppSidebar({
  pathname,
  children
}: PropsWithChildren<{ pathname: string }>) {
  return (
    <SidebarProvider defaultOpen>
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="/">
                      <Home />
                      <span>Home</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>GitLab</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem
                    key={item.title}
                    className={
                      pathname === item.url ? 'bg-sidebar-accent' : undefined
                    }
                  >
                    <SidebarMenuButton asChild>
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <div className="flex flex-1 items-end">
            <SidebarTrigger className="w-full " />
          </div>
        </SidebarContent>
      </Sidebar>

      <SidebarTriggerCollapsed />

      {children}
    </SidebarProvider>
  );
}

function SidebarTriggerCollapsed() {
  const { isMobile, open: isOpen } = useSidebar();

  return isOpen && !isMobile ? null : (
    <div className="flex items-end border border-sidebar-border">
      <SidebarTrigger className="rotate-180" />
    </div>
  );
}

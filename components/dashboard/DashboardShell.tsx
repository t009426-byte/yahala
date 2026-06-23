"use client";

import { SideProvider } from "@/components/SideProvider";
import { LanguageProvider } from "@/components/LanguageProvider";
import type { GuestSide } from "@/types";

interface Props {
  children: React.ReactNode;
  defaultSide: GuestSide;
  locked: boolean;
}

export function DashboardShell({ children, defaultSide, locked }: Props) {
  return (
    <SideProvider defaultSide={defaultSide} locked={locked}>
      <LanguageProvider>{children}</LanguageProvider>
    </SideProvider>
  );
}

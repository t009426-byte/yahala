"use client";

import { createContext, useContext, useState } from "react";
import type { GuestSide } from "@/types";

interface SideCtxValue {
  side: GuestSide;
  setSide: (s: GuestSide) => void;
  locked: boolean;
}

const SideContext = createContext<SideCtxValue>({ side: "BRIDE", setSide: () => {}, locked: false });

export function SideProvider({
  children,
  defaultSide = "BRIDE",
  locked = false,
}: {
  children: React.ReactNode;
  defaultSide?: GuestSide;
  locked?: boolean;
}) {
  const [side, setSideState] = useState<GuestSide>(defaultSide);
  const setSide = locked ? () => {} : setSideState;
  return <SideContext.Provider value={{ side, setSide, locked }}>{children}</SideContext.Provider>;
}

export function useSide() {
  return useContext(SideContext);
}

import { createClient } from "./supabase/server";
import { prisma } from "./prisma";
import type { UserRole } from "@/types";

export interface AppSession {
  user: {
    id: string;
    email: string;
    name: string | null;
    label: string | null;
    role: UserRole;
    eventId: string | null;
  };
}

export async function auth(): Promise<AppSession | null> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user || !user.email) return null;

    let dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { id: true, name: true, label: true, role: true, eventId: true },
    });

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: { email: user.email, role: "GATE_STAFF" },
        select: { id: true, name: true, label: true, role: true, eventId: true },
      });
    }

    return {
      user: {
        id: dbUser.id,
        email: user.email,
        name: dbUser.name,
        label: dbUser.label,
        role: dbUser.role,
        eventId: dbUser.eventId,
      },
    };
  } catch {
    return null;
  }
}

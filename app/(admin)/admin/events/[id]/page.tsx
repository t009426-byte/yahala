import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EventAdminView } from "@/components/admin/EventAdminView";

export const dynamic = "force-dynamic";

export default async function AdminEventPage({ params }: { params: { id: string } }) {
  const session = await auth();
  const isDev = process.env.NODE_ENV === "development";
  if (!session && !isDev) redirect("/login");

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      users: {
        select: { id: true, name: true, email: true, role: true, label: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
      vouchers: { orderBy: { createdAt: "desc" } },
      _count: { select: { guests: true, gifts: true } },
    },
  });

  if (!event) notFound();

  // Serialize Date fields for the client component
  const serialized = {
    ...event,
    date: event.date.toISOString(),
    createdAt: event.createdAt.toISOString(),
    users: event.users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() })),
    vouchers: event.vouchers.map((v) => ({
      ...v,
      amount: v.amount ? String(v.amount) : null,
      expiresAt: v.expiresAt ? v.expiresAt.toISOString() : null,
      createdAt: v.createdAt.toISOString(),
    })),
  };

  return <EventAdminView event={serialized} />;
}

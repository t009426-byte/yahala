import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { GiftsView } from "@/components/dashboard/GiftsView";

export const dynamic = "force-dynamic";

export default async function GiftsPage() {
  const session = await auth();
  const isDev = process.env.NODE_ENV === "development";
  if (!session && !isDev) redirect("/login");

  const eventId = session?.user.eventId ?? (isDev ? "event-demo-001" : null);
  if (!eventId) redirect("/");

  return <GiftsView eventId={eventId} />;
}

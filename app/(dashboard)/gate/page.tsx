import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { GateApp } from "@/components/dashboard/GateApp";

export const dynamic = "force-dynamic";

export default async function GatePage() {
  const session = await auth();
  const isDev = process.env.NODE_ENV === "development";
  if (!session && !isDev) redirect("/login");

  const eventId = session?.user.eventId ?? (isDev ? "dev-preview" : null);
  if (!eventId) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <p className="text-muted-foreground text-sm">لا توجد فعالية مرتبطة بحسابك</p>
      </div>
    );
  }

  return <GateApp eventId={eventId} />;
}

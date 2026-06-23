import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { GuestsManage } from "@/components/dashboard/GuestsManage";

export const dynamic = "force-dynamic";

export default async function GuestsPage() {
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

  const canAddGuest =
    !session ||
    session.user.role === "ORGANIZER" ||
    session.user.role === "BRIDE_FAMILY" ||
    session.user.role === "GROOM_FAMILY";

  const defaultSide =
    session?.user.role === "BRIDE_FAMILY"
      ? "BRIDE"
      : session?.user.role === "GROOM_FAMILY"
      ? "GROOM"
      : "BRIDE";

  return (
    <GuestsManage
      eventId={eventId}
      canAdd={canAddGuest}
      defaultSide={defaultSide as "BRIDE" | "GROOM"}
    />
  );
}

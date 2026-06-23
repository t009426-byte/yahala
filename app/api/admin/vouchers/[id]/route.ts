import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(role: string) { return role === "ADMIN"; }

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const isDev = process.env.NODE_ENV === "development";
  if (!session && !isDev) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session && !isAdmin(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.voucher.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const isDev = process.env.NODE_ENV === "development";
  if (!session && !isDev) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session && !isAdmin(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { isActive } = await req.json() as { isActive?: boolean };
  const voucher = await prisma.voucher.update({
    where: { id: params.id },
    data: { ...(isActive !== undefined && { isActive }) },
  });
  return NextResponse.json({ data: voucher });
}

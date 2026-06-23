import { PrismaClient, GuestSide, GuestTier } from "@prisma/client";

const prisma = new PrismaClient();

const BRIDE_GUESTS = [
  { name: "نورة الرشيدي",   phone: "+96550001001" },
  { name: "دانة المطيري",   phone: "+96550001002" },
  { name: "هيا العنزي",     phone: "+96550001003" },
  { name: "ريم الشمري",     phone: "+96550001004" },
  { name: "لولوة الحربي",   phone: "+96550001005" },
  { name: "مريم العجمي",    phone: "+96550001006" },
  { name: "فاطمة البدر",    phone: "+96550001007" },
  { name: "أمل الكندري",    phone: "+96550001008" },
  { name: "سارة العمر",     phone: "+96550001009" },
  { name: "شيخة المنصور",   phone: "+96550001010" },
];

const GROOM_GUESTS = [
  { name: "فهد الزهراني",   phone: "+96560002001" },
  { name: "خالد الدوسري",   phone: "+96560002002" },
  { name: "عبدالله القحطاني", phone: "+96560002003" },
  { name: "سلطان الشهري",   phone: "+96560002004" },
  { name: "ماجد العتيبي",   phone: "+96560002005" },
  { name: "بدر الغامدي",    phone: "+96560002006" },
  { name: "يوسف الأحمدي",   phone: "+96560002007" },
  { name: "حمد المالكي",    phone: "+96560002008" },
  { name: "نايف السبيعي",   phone: "+96560002009" },
  { name: "وليد البلوي",    phone: "+96560002010" },
];

async function main() {
  console.log("Seeding database...");

  // Create event (delete first to allow re-runs)
  await prisma.event.deleteMany({ where: { id: "event-demo-001" } });
  const event = await prisma.event.create({
    data: {
      id:          "event-demo-001",
      name:        "حفل زفاف فهد ونورة",
      coupleNames: "فهد العتيبي & نورة الرشيدي",
      date:        new Date("2026-09-15T19:00:00Z"),
      venue:       "قاعة الريجنسي — مجمع المنيرة، الكويت",
      capacity:    300,
    },
  });

  console.log(`Event: ${event.coupleNames} (${event.id})`);

  // Seed bride guests
  const brideResult = await prisma.guest.createMany({
    data: BRIDE_GUESTS.map((g, i) => ({
      eventId:     event.id,
      name:        g.name,
      phone:       g.phone,
      side:        GuestSide.BRIDE,
      tier:        GuestTier.GENERAL,
      qrToken:     `bride-${g.phone}`,
      tableNumber: Math.ceil((i + 1) / 2),
    })),
    skipDuplicates: true,
  });

  // Seed groom guests (first two are VIP with +1)
  const groomResult = await prisma.guest.createMany({
    data: GROOM_GUESTS.map((g, i) => ({
      eventId:       event.id,
      name:          g.name,
      phone:         g.phone,
      side:          GuestSide.GROOM,
      tier:          i < 2 ? GuestTier.VIP : GuestTier.GENERAL,
      qrToken:       `groom-${g.phone}`,
      tableNumber:   Math.ceil((i + 1) / 2) + 10,
      plusOneAllowed: i < 2,
    })),
    skipDuplicates: true,
  });

  console.log(`Done — ${brideResult.count} bride guests + ${groomResult.count} groom guests added`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

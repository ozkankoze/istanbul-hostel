/**
 * Seeds the database with clearly-labelled demonstration data.
 * Run: npm run db:seed   (destructive — wipes existing data)
 */
import "dotenv/config";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type HousekeepingStatus } from "../src/generated/prisma/client";
import {
  contentBlocks,
  experiences,
  faqs,
  guideConfig,
  guideItems,
  places,
  roomTypes,
  rooms,
  testimonials,
  L,
} from "./seed-content";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

const ALPHA = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const ref = (p: string) =>
  `${p}-${Array.from(randomBytes(6), (b) => ALPHA[b % ALPHA.length]).join("")}`;

function today() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return new Date(`${parts}T00:00:00.000Z`);
}
const day = (offset: number) => {
  const d = today();
  d.setUTCDate(d.getUTCDate() + offset);
  return d;
};
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000);

async function wipe() {
  // Order matters for FK constraints
  await db.auditLog.deleteMany();
  await db.taskEvent.deleteMany();
  await db.task.deleteMany();
  await db.housekeepingLog.deleteMany();
  await db.serviceRequest.deleteMany();
  await db.guestAccess.deleteMany();
  await db.allocation.deleteMany();
  await db.reservation.deleteMany();
  await db.guest.deleteMany();
  await db.experienceBooking.deleteMany();
  await db.transferRequest.deleteMany();
  await db.qrCode.deleteMany();
  await db.blockedDate.deleteMany();
  await db.bed.deleteMany();
  await db.room.deleteMany();
  await db.session.deleteMany();
  await db.loginAttempt.deleteMany();
  await db.user.deleteMany();
  await db.property.deleteMany();
}

async function main() {
  console.log("Seeding Istanbul Hostel demo data…");
  await wipe();

  const property = await db.property.create({
    data: {
      slug: "istanbul-hostel",
      name: "Istanbul Hostel",
      tagline: L(
        "A friendly hostel between Galata and the Bosphorus.",
        "Prijatan hostel između Galate i Bosfora.",
        "Galata ile Boğaz arasında samimi bir hostel.",
      ),
      // Sample details for demonstration only — not a real business.
      addressLine: "Örnek Sokak 12, Kemankeş Mah., Beyoğlu",
      city: "Istanbul",
      country: "Türkiye",
      phone: "+90 212 000 00 00",
      whatsapp: "+90 500 000 00 00",
      email: "hello@istanbulhostel.example",
      mapQuery: "Galata Tower, Beyoğlu, Istanbul",
      latitude: 41.0256,
      longitude: 28.9741,
      reviewUrl: "https://www.google.com/maps/search/?api=1&query=Galata+Tower+Istanbul",
      isDemo: true,
    },
  });
  const propertyId = property.id;

  await db.setting.createMany({
    data: [
      { propertyId, key: "booking.maxNights", value: 30 },
      { propertyId, key: "booking.maxGuests", value: 8 },
      { propertyId, key: "booking.autoNote", value: "Reservations are requests until confirmed by reception." },
      { propertyId, key: "transfer.priceIST", value: 45 },
      { propertyId, key: "transfer.priceSAW", value: 55 },
      { propertyId, key: "brand.primaryColor", value: "#1F3C7A" },
    ],
  });

  // ── Staff ──────────────────────────────────────────────
  let demoPassword = process.env.DEMO_PASSWORD;
  if (!demoPassword) {
    demoPassword = randomBytes(9).toString("base64url");
    console.log(`\n  No DEMO_PASSWORD set — generated one for all demo accounts: ${demoPassword}\n`);
  }
  const passwordHash = await bcrypt.hash(demoPassword, 12);
  const staffSeed = [
    { name: "Elif Demir", email: "admin@istanbulhostel.example", role: "ADMIN" as const },
    { name: "Amar Hodžić", email: "manager@istanbulhostel.example", role: "MANAGER" as const },
    { name: "Selin Kaya", email: "reception@istanbulhostel.example", role: "RECEPTION" as const },
    { name: "Ayşe Yılmaz", email: "ayse@istanbulhostel.example", role: "HOUSEKEEPING" as const },
    { name: "Mehmet Çelik", email: "mehmet@istanbulhostel.example", role: "HOUSEKEEPING" as const },
    { name: "Lejla Begić", email: "lejla@istanbulhostel.example", role: "HOUSEKEEPING" as const },
  ];
  const users: Record<string, { id: string; name: string }> = {};
  for (const s of staffSeed) {
    const u = await db.user.create({ data: { ...s, passwordHash } });
    users[s.email.split("@")[0]!] = u;
  }
  const hk = [users.ayse!, users.mehmet!, users.lejla!];

  // ── Room types, rooms, beds ─────────────────────────────
  const typeBySlug: Record<string, { id: string; kind: string; capacity: number; basePrice: number }> = {};
  for (const rt of roomTypes) {
    const created = await db.roomType.create({ data: { ...rt, propertyId } });
    typeBySlug[rt.slug] = { id: created.id, kind: rt.kind, capacity: rt.capacity, basePrice: rt.basePrice };
  }

  const roomByNumber: Record<string, { id: string; beds: string[]; type: string }> = {};
  for (const r of rooms) {
    const t = typeBySlug[r.type]!;
    const bedCount = t.kind === "DORM" ? t.capacity : 1;
    const room = await db.room.create({
      data: {
        propertyId,
        roomTypeId: t.id,
        number: r.number,
        floor: r.floor,
        beds: {
          create: Array.from({ length: bedCount }, (_, i) => ({
            label: t.kind === "DORM" ? `${String.fromCharCode(65 + Math.floor(i / 2))}${(i % 2) + 1}` : "Room",
          })),
        },
      },
      include: { beds: { orderBy: { label: "asc" } } },
    });
    roomByNumber[r.number] = { id: room.id, beds: room.beds.map((b) => b.id), type: r.type };
  }

  // ── Guests & reservations ──────────────────────────────
  const guestsSeed = [
    ["Lena", "Fischer", "Germany"],
    ["Marco", "Rossi", "Italy"],
    ["Aida", "Kovačević", "Bosnia and Herzegovina"],
    ["James", "Walker", "United Kingdom"],
    ["Sofia", "García", "Spain"],
    ["Emir", "Hadžić", "Bosnia and Herzegovina"],
    ["Yuki", "Tanaka", "Japan"],
    ["Chloé", "Martin", "France"],
    ["Noah", "Johnson", "United States"],
    ["Zeynep", "Arslan", "Türkiye"],
    ["Liam", "O'Brien", "Ireland"],
    ["Maja", "Nowak", "Poland"],
    ["Daniel", "Silva", "Brazil"],
    ["Ana", "Petrović", "Serbia"],
  ] as const;
  const guestIds: string[] = [];
  for (const [firstName, lastName, country] of guestsSeed) {
    const g = await db.guest.create({
      data: {
        firstName,
        lastName,
        country,
        email: `${firstName.toLowerCase().normalize("NFD").replace(/[^a-z]/g, "")}.${lastName
          .toLowerCase()
          .normalize("NFD")
          .replace(/[^a-z]/g, "")}@example.com`,
        phone: "+00 000 000 000",
        notes: "Demo guest",
      },
    });
    guestIds.push(g.id);
  }

  type ResSeed = {
    guest: number;
    type: string;
    from: number;
    to: number;
    guests: number;
    status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "DECLINED";
    alloc?: { room: string; beds?: number[] }[];
    note?: string;
    reference?: string;
  };
  const resSeed: ResSeed[] = [
    // In house now
    { guest: 0, type: "mixed-dorm", from: -2, to: 2, guests: 1, status: "CONFIRMED", alloc: [{ room: "101", beds: [0] }], reference: "IH-DEMO24" },
    { guest: 1, type: "mixed-dorm", from: -1, to: 3, guests: 2, status: "CONFIRMED", alloc: [{ room: "101", beds: [1, 2] }] },
    { guest: 2, type: "female-dorm", from: -3, to: 1, guests: 1, status: "CONFIRMED", alloc: [{ room: "103", beds: [0] }] },
    { guest: 3, type: "private-double", from: -1, to: 2, guests: 2, status: "CONFIRMED", alloc: [{ room: "204" }], note: "Anniversary — would love a quiet room" },
    { guest: 4, type: "deluxe-private", from: -2, to: 0, guests: 2, status: "CONFIRMED", alloc: [{ room: "401" }] },
    { guest: 5, type: "mixed-dorm", from: -4, to: 0, guests: 1, status: "CONFIRMED", alloc: [{ room: "201", beds: [0] }] },
    { guest: 6, type: "private-double", from: -2, to: 4, guests: 1, status: "CONFIRMED", alloc: [{ room: "301" }] },
    // Arriving today / soon
    { guest: 7, type: "female-dorm", from: 0, to: 3, guests: 2, status: "CONFIRMED", alloc: [{ room: "203", beds: [0, 1] }] },
    { guest: 8, type: "deluxe-private", from: 0, to: 5, guests: 2, status: "CONFIRMED", alloc: [{ room: "402" }] },
    { guest: 9, type: "mixed-dorm", from: 1, to: 4, guests: 3, status: "CONFIRMED", alloc: [{ room: "202", beds: [0, 1, 2] }] },
    // Pending requests
    { guest: 10, type: "private-double", from: 2, to: 6, guests: 2, status: "PENDING", note: "Arriving around 23:00" },
    { guest: 11, type: "mixed-dorm", from: 3, to: 5, guests: 1, status: "PENDING" },
    { guest: 12, type: "deluxe-private", from: 6, to: 9, guests: 2, status: "PENDING", note: "Could we have early check-in?" },
    { guest: 13, type: "female-dorm", from: 9, to: 12, guests: 1, status: "PENDING" },
    // History
    { guest: 0, type: "mixed-dorm", from: -20, to: -16, guests: 1, status: "COMPLETED", alloc: [{ room: "102", beds: [3] }] },
    { guest: 3, type: "private-double", from: -14, to: -11, guests: 2, status: "COMPLETED", alloc: [{ room: "302" }] },
    { guest: 9, type: "deluxe-private", from: -9, to: -6, guests: 2, status: "COMPLETED", alloc: [{ room: "402" }] },
    { guest: 11, type: "mixed-dorm", from: 5, to: 8, guests: 2, status: "CANCELLED", note: "Guest changed plans" },
    { guest: 12, type: "private-double", from: 1, to: 3, guests: 2, status: "DECLINED", note: "Fully booked" },
  ];

  for (const r of resSeed) {
    const t = typeBySlug[r.type]!;
    const nights = r.to - r.from;
    const units = t.kind === "DORM" ? r.guests : Math.ceil(r.guests / t.capacity);
    const total = t.basePrice * units * nights;
    const created = await db.reservation.create({
      data: {
        reference: r.reference ?? ref("IH"),
        propertyId,
        roomTypeId: t.id,
        guestId: guestIds[r.guest]!,
        checkIn: day(r.from),
        checkOut: day(r.to),
        guests: r.guests,
        units,
        nightlyPrice: t.basePrice,
        totalPrice: total,
        status: r.status,
        specialRequests: r.note ?? null,
        statusReason: r.status === "DECLINED" ? "No availability for these dates" : r.status === "CANCELLED" ? "Cancelled by guest" : null,
        confirmedAt: r.status === "CONFIRMED" || r.status === "COMPLETED" ? hoursAgo(48) : null,
        isDemo: true,
        createdAt: hoursAgo(r.status === "PENDING" ? 3 + r.guest : 72 + r.guest * 5),
        source: r.guest % 4 === 0 ? "ADMIN" : "WEBSITE",
      },
    });
    for (const a of r.alloc ?? []) {
      const room = roomByNumber[a.room]!;
      const bedIdx = a.beds ?? [0];
      for (const i of bedIdx) {
        await db.allocation.create({
          data: {
            reservationId: created.id,
            roomId: room.id,
            bedId: room.beds[i] ?? null,
            checkIn: day(r.from),
            checkOut: day(r.to),
          },
        });
      }
    }
  }

  // ── Housekeeping status ────────────────────────────────
  const hkStatus: Record<string, { status: HousekeepingStatus; who?: number; note?: string; h: number }> = {
    "101": { status: "CLEAN", who: 0, h: 5 },
    "102": { status: "INSPECTED", who: 0, h: 3 },
    "103": { status: "CLEAN", who: 2, h: 6 },
    "201": { status: "DIRTY", who: 1, h: 1 },
    "202": { status: "CLEANING", who: 1, h: 0.5 },
    "203": { status: "INSPECTED", who: 2, h: 2 },
    "204": { status: "CLEAN", who: 0, h: 7 },
    "301": { status: "CLEAN", who: 2, h: 8 },
    "302": { status: "MAINTENANCE", who: 1, note: "Shower drain slow — plumber booked", h: 4 },
    "303": { status: "INSPECTED", who: 0, h: 9 },
    "401": { status: "DIRTY", who: 2, h: 1.5 },
    "402": { status: "CLEANING", who: 0, h: 0.3 },
  };
  for (const [num, s] of Object.entries(hkStatus)) {
    const room = roomByNumber[num]!;
    await db.room.update({
      where: { id: room.id },
      data: {
        housekeepingStatus: s.status,
        housekeepingNote: s.note ?? null,
        statusUpdatedAt: hoursAgo(s.h),
        assignedToId: s.who != null ? hk[s.who]!.id : null,
      },
    });
    await db.housekeepingLog.create({
      data: { roomId: room.id, fromStatus: "DIRTY", toStatus: s.status, userId: hk[s.who ?? 0]!.id, note: s.note, createdAt: hoursAgo(s.h) },
    });
  }

  await db.blockedDate.create({
    data: { roomId: roomByNumber["302"]!.id, startDate: day(0), endDate: day(2), reason: "Bathroom repair" },
  });

  // ── Tasks ──────────────────────────────────────────────
  const taskSeed = [
    { room: "201", title: "Check-out clean — dorm 201", type: "CLEANING", priority: "HIGH", status: "OPEN", who: 1, due: 2 },
    { room: "202", title: "Prepare 3 beds for arrival", type: "CLEANING", priority: "HIGH", status: "IN_PROGRESS", who: 1, due: 3 },
    { room: "401", title: "Departure clean — deluxe 401", type: "CLEANING", priority: "NORMAL", status: "OPEN", who: 2, due: 4 },
    { room: "402", title: "Arrival set-up with welcome tea", type: "CLEANING", priority: "HIGH", status: "IN_PROGRESS", who: 0, due: 2 },
    { room: "302", title: "Shower drain slow", type: "MAINTENANCE", priority: "URGENT", status: "OPEN", who: null, due: 6 },
    { room: "102", title: "Final inspection", type: "INSPECTION", priority: "NORMAL", status: "DONE", who: 0, due: -2 },
    { room: null, title: "Restock rooftop breakfast supplies", type: "CUSTOM", priority: "NORMAL", status: "OPEN", who: 2, due: 20 },
    { room: null, title: "Wash and fold common-room cushions", type: "CUSTOM", priority: "LOW", status: "OPEN", who: 0, due: 30 },
    { room: "203", title: "Replace reading light bulb, bed B1", type: "MAINTENANCE", priority: "LOW", status: "DONE", who: 1, due: -5 },
  ] as const;
  for (const t of taskSeed) {
    const task = await db.task.create({
      data: {
        propertyId,
        roomId: t.room ? roomByNumber[t.room]!.id : null,
        title: t.title,
        type: t.type,
        priority: t.priority,
        status: t.status,
        assignedToId: t.who != null ? hk[t.who]!.id : null,
        createdById: users.manager!.id,
        dueAt: new Date(Date.now() + t.due * 3_600_000),
        startedAt: t.status !== "OPEN" ? hoursAgo(1) : null,
        completedAt: t.status === "DONE" ? hoursAgo(-t.due) : null,
      },
    });
    await db.taskEvent.create({ data: { taskId: task.id, userId: users.manager!.id, kind: "created", message: "Task created", createdAt: hoursAgo(6) } });
    if (t.status !== "OPEN") {
      await db.taskEvent.create({ data: { taskId: task.id, userId: t.who != null ? hk[t.who]!.id : null, kind: "started", message: "Started", createdAt: hoursAgo(1) } });
    }
    if (t.status === "DONE") {
      await db.taskEvent.create({ data: { taskId: task.id, userId: t.who != null ? hk[t.who]!.id : null, kind: "completed", message: "Marked done", createdAt: hoursAgo(0.5) } });
    }
  }

  // ── Experiences & bookings ─────────────────────────────
  const expBySlug: Record<string, { id: string; price: number; unit: string }> = {};
  for (const e of experiences) {
    const created = await db.experience.create({ data: { ...e, propertyId } });
    expBySlug[e.slug] = { id: created.id, price: e.price, unit: e.priceUnit };
  }
  const nextDayFor = (days: number[], from: number) => {
    for (let i = from; i < from + 14; i++) if (days.includes(day(i).getUTCDay())) return i;
    return from;
  };
  const expBookings = [
    { slug: "bosphorus-cruise", from: 0, n: 2, name: "Lena Fischer", status: "CONFIRMED", room: "101" },
    { slug: "bosphorus-cruise", from: 1, n: 3, name: "Zeynep Arslan", status: "PENDING", room: null },
    { slug: "old-city-walking-tour", from: 1, n: 2, name: "James Walker", status: "PENDING", room: "204" },
    { slug: "turkish-food-experience", from: 2, n: 2, name: "Chloé Martin", status: "CONFIRMED", room: "203" },
    { slug: "pub-crawl", from: 0, n: 4, name: "Marco Rossi", status: "PENDING", room: "101" },
    { slug: "old-city-walking-tour", from: -6, n: 1, name: "Emir Hadžić", status: "COMPLETED", room: "201" },
  ] as const;
  for (const b of expBookings) {
    const e = experiences.find((x) => x.slug === b.slug)!;
    const offset = b.from < 0 ? b.from : nextDayFor(e.availableDays, b.from);
    const x = expBySlug[b.slug]!;
    await db.experienceBooking.create({
      data: {
        reference: ref("EX"),
        experienceId: x.id,
        date: day(offset),
        participants: b.n,
        totalPrice: x.unit === "GROUP" ? x.price : x.price * b.n,
        name: b.name,
        email: `${b.name.split(" ")[0]!.toLowerCase().normalize("NFD").replace(/[^a-z]/g, "")}@example.com`,
        roomNumber: b.room,
        status: b.status,
        isDemo: true,
        source: b.room ? "GUEST_PORTAL" : "WEBSITE",
        createdAt: hoursAgo(5),
      },
    });
  }

  await db.transferRequest.createMany({
    data: [
      { reference: ref("TR"), propertyId, airport: "IST", flightNumber: "TK1022", arrivalAt: new Date(day(1).getTime() + 22 * 3_600_000), passengers: 2, name: "Liam O'Brien", email: "liam@example.com", phone: "+00 000 000 000", status: "PENDING", isDemo: true },
      { reference: ref("TR"), propertyId, airport: "SAW", flightNumber: "PC302", arrivalAt: new Date(day(2).getTime() + 9.5 * 3_600_000), passengers: 1, name: "Maja Nowak", email: "maja@example.com", phone: "+00 000 000 000", status: "CONFIRMED", isDemo: true },
    ],
  });

  // ── Guest guide ────────────────────────────────────────
  await db.guideConfig.create({ data: { ...guideConfig, propertyId } });
  await db.guideItem.createMany({ data: guideItems.map((g) => ({ ...g, propertyId })) });
  await db.place.createMany({ data: places.map((p, i) => ({ ...p, propertyId, sortOrder: i, transitNote: "transitNote" in p ? p.transitNote : undefined })) });

  // ── Service requests & feedback ───────────────────────
  const inHouse = await db.reservation.findFirst({ where: { reference: "IH-DEMO24" } });
  await db.serviceRequest.createMany({
    data: [
      { reference: ref("SR"), propertyId, roomId: roomByNumber["101"]!.id, reservationId: inHouse?.id, type: "TOWELS", message: "Two extra towels please", status: "OPEN", createdAt: hoursAgo(0.7) },
      { reference: ref("SR"), propertyId, roomId: roomByNumber["204"]!.id, type: "MAINTENANCE", message: "The reading lamp on the left side doesn't switch on", status: "IN_PROGRESS", createdAt: hoursAgo(2) },
      { reference: ref("SR"), propertyId, roomId: roomByNumber["301"]!.id, type: "AMENITIES", message: "Could I get a toothbrush?", status: "RESOLVED", createdAt: hoursAgo(20) },
    ],
  });
  await db.feedback.createMany({
    data: [
      { propertyId, rating: 5, message: "Breakfast on the roof is wonderful. Thank you Selin for the ferry tips!", name: "Demo guest", roomNumber: "204", isDemo: true, createdAt: hoursAgo(10) },
      { propertyId, rating: 4, message: "Great stay, but the Wi-Fi was slow in the evening on floor 2.", name: "Demo guest", roomNumber: "201", isDemo: true, createdAt: hoursAgo(30) },
    ],
  });
  await db.contactMessage.create({
    data: { propertyId, name: "Demo visitor", email: "visitor@example.com", subject: "Group booking", message: "Hi! We're a group of 8 friends visiting in spring. Do you offer a group rate?", createdAt: hoursAgo(4) },
  });

  // ── Website content ───────────────────────────────────
  await db.faq.createMany({ data: faqs.map((f, i) => ({ ...f, propertyId, sortOrder: i })) });
  await db.testimonial.createMany({ data: testimonials.map((t, i) => ({ ...t, propertyId, sortOrder: i, isSample: true })) });
  for (const [key, value] of Object.entries(contentBlocks)) {
    await db.contentBlock.create({ data: { propertyId, key, value } });
  }

  // ── QR codes ───────────────────────────────────────────
  await db.qrCode.create({ data: { propertyId, label: "Reception desk", path: "/guest", scans: 41 } });
  for (const r of rooms) {
    await db.qrCode.create({
      data: { propertyId, label: `Room ${r.number}`, roomId: roomByNumber[r.number]!.id, path: `/guest?room=${r.number}`, scans: Math.floor(Math.random() * 25) },
    });
  }

  await db.auditLog.create({
    data: { userId: users.admin!.id, action: "seed", entity: "Property", entityId: propertyId, summary: "Demo data loaded" },
  });

  console.log("Done. 12 rooms, %d reservations, %d experiences.", resSeed.length, experiences.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

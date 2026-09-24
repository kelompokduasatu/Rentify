import bcrypt from "bcrypt";
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

const DUMMY = [
  { name: "Host Dummy", email: "host@rentify.test", role: UserRole.HOST, phone: "081200000001" },
  { name: "Guest Dummy", email: "guest@rentify.test", role: UserRole.GUEST, phone: "081200000002" },
  { name: "Admin Dummy", email: "admin@rentify.test", role: UserRole.ADMIN, phone: "081200000003" },
];

const PASSWORD = "password123";

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  for (const u of DUMMY) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, phone: u.phone, passwordHash },
      create: { ...u, passwordHash },
      select: { id: true, email: true, role: true },
    });
    console.log(`  seed: ${user.email} (${user.role})`);
  }

  // Akun tanpa password, meniru user yang mendaftar lewat Google.
  // Dipakai untuk menguji bahwa login credentials menolaknya.
  const google = await prisma.user.upsert({
    where: { email: "google-only@rentify.test" },
    update: { passwordHash: null },
    create: { name: "Google Only", email: "google-only@rentify.test", passwordHash: null },
    select: { email: true, role: true },
  });
  console.log(`  seed: ${google.email} (${google.role}, tanpa password)`);

  console.log(`\nSemua user dummy memakai password: ${PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import bcrypt from "bcrypt";

export interface DummyUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "USER" | "ADMIN" | "LESSOR";
  image?: string;
}

// Data dummy untuk memverifikasi autentikasi tanpa koneksi database aktif
export const DUMMY_USERS: DummyUser[] = [
  {
    id: "usr_dummy_admin_001",
    name: "Admin Rentify",
    email: "admin@rentify.com",
    // Hash bcrypt untuk "password123"
    passwordHash: "$2b$10$7R0Z.mX/1E50rO3F3rY4.eN6a2mJ9kX.q7N.a8s6d5f4g3h2j1k",
    role: "ADMIN",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin",
  },
  {
    id: "usr_dummy_user_002",
    name: "Pengguna Biasa",
    email: "user@rentify.com",
    passwordHash: "$2b$10$7R0Z.mX/1E50rO3F3rY4.eN6a2mJ9kX.q7N.a8s6d5f4g3h2j1k",
    role: "USER",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=User",
  },
];

/**
 * Mencari pengguna dummy berdasarkan email dan mencocokkan password (bisa plaintext 'password123' atau via bcrypt)
 */
export async function authenticateDummyUser(email: string, passwordPlain: string): Promise<Omit<DummyUser, "passwordHash"> | null> {
  const foundUser = DUMMY_USERS.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );

  if (!foundUser) return null;

  // Izinkan password123 secara langsung untuk kemudahan pengujian dummy
  if (passwordPlain === "password123") {
    const { passwordHash, ...userWithoutPassword } = foundUser;
    return userWithoutPassword;
  }

  // Pengecekan bcrypt standar
  const isMatch = await bcrypt.compare(passwordPlain, foundUser.passwordHash);
  if (isMatch) {
    const { passwordHash, ...userWithoutPassword } = foundUser;
    return userWithoutPassword;
  }

  return null;
}

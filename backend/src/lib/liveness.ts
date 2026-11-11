import crypto from "crypto";

export interface LivenessStreamData {
  imageBase64?: string;
  sessionData?: unknown;
}

export interface LivenessVerificationResult {
  valid: boolean;
  status: "VALID" | "INVALID";
  confidence: number;
  provider: "DUMMY_PLACEHOLDER" | "AZURE_FACE_LIVENESS";
  verifiedAt: string;
}

export interface LivenessTokenPayload {
  status: "VALID";
  iat: number;
  exp: number;
  nonce: string;
}

const LIVENESS_TOKEN_TTL_MS = 10 * 60 * 1000; // 10 menit
const MOCK_DELAY_MS = 1000; // ~1 detik simulasi pemindaian biometrik

function getSecret(): string {
  return process.env.AUTH_SECRET ?? "rentify-dev-fallback-liveness-secret";
}

/**
 * Fungsi modular verifikasi Face Liveness.
 * Saat ini menggunakan dummy placeholder yang mensimulasikan latensi pemindaian (~1 detik)
 * dan selalu mengembalikan status VALID.
 * Kedepannya isi fungsi ini dapat langsung diganti dengan pemanggilan SDK / API
 * Microsoft Azure Face Liveness tanpa mengubah kontrak di route.
 */
export async function verifyFaceLiveness(
  _streamData?: LivenessStreamData
): Promise<LivenessVerificationResult> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

  return {
    valid: true,
    status: "VALID",
    confidence: 1.0,
    provider: "DUMMY_PLACEHOLDER",
    verifiedAt: new Date().toISOString(),
  };
}

/**
 * Menerbitkan token bukti liveness bertanda tangan HMAC-SHA256 (stateless)
 * setelah `verifyFaceLiveness()` menyatakan wajah valid.
 */
export function createLivenessToken(): { token: string; expiresAt: string } {
  const now = Date.now();
  const exp = now + LIVENESS_TOKEN_TTL_MS;

  const payload: LivenessTokenPayload = {
    status: "VALID",
    iat: now,
    exp,
    nonce: crypto.randomBytes(8).toString("hex"),
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url"
  );
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(encodedPayload)
    .digest("base64url");

  return {
    token: `${encodedPayload}.${signature}`,
    expiresAt: new Date(exp).toISOString(),
  };
}

/**
 * Memverifikasi keaslian dan masa berlaku `livenessToken` yang dikirim
 * saat `POST /api/auth/register`.
 */
export function verifyLivenessToken(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [encodedPayload, signature] = parts;
  if (!encodedPayload || !signature) return false;

  const expectedSignature = crypto
    .createHmac("sha256", getSecret())
    .update(encodedPayload)
    .digest("base64url");

  const sigBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return false;
  }

  try {
    const raw = Buffer.from(encodedPayload, "base64url").toString("utf8");
    const payload = JSON.parse(raw) as Partial<LivenessTokenPayload>;

    if (payload.status !== "VALID") return false;
    if (typeof payload.exp !== "number" || Date.now() > payload.exp) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

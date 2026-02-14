import { verifyFirebaseToken } from "@/lib/firebase/firebaseAdmin";
import { db } from "@/lib/prisma/prisma";

//Admin only
export async function requireAdmin(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) throw new Error("Unauthorized");

  const token = authHeader.replace("Bearer", "").trim();
  const decoded = await verifyFirebaseToken(token);

  const user = await db.user.findUnique({
    where: { firebaseUid: decoded.uid },
  });

  if (!user || user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  return user;
}

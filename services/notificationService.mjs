import pool from "../utils/db.mjs";

/** status_id ในตาราง posts: 2 = Published (public) */
export const PUBLISHED_STATUS_ID = 2;

/**
 * แจ้งเตือนหนึ่งคน — INSERT ลงตาราง notifications (Supabase Realtime จะ push ให้ client)
 */
export async function createNotification({ user_id, type, message, meta = {} }) {
  const { rows } = await pool.query(
    `INSERT INTO notifications (user_id, type, message, meta, is_read, created_at)
     VALUES ($1, $2, $3, $4::jsonb, false, NOW())
     RETURNING id`,
    [user_id, type, message, JSON.stringify(meta)],
  );
  return rows[0];
}

/**
 * แจ้งเตือนหลาย user พร้อมกัน (เช่น สมาชิกทุกคนเมื่อมีบทความใหม่)
 */
export async function createNotificationsForUsers(userIds, { type, message, meta = {} }) {
  if (!userIds?.length) return;
  const metaJson = JSON.stringify(meta);
  const values = userIds
    .map((_, i) => {
      const b = i * 4;
      return `($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}::jsonb, false, NOW())`;
    })
    .join(", ");
  const params = userIds.flatMap((id) => [id, type, message, metaJson]);
  await pool.query(
    `INSERT INTO notifications (user_id, type, message, meta, is_read, created_at) VALUES ${values}`,
    params,
  );
}

/** ดึง id ของสมาชิกทุกคน (role = user) สำหรับแจ้งบทความใหม่ */
export async function getMemberUserIds() {
  const { rows } = await pool.query(
    `SELECT id FROM users WHERE role = $1`,
    ["user"],
  );
  return rows.map((r) => r.id);
}

export function logNotificationError(context, err) {
  console.error(`[notifications] ${context}:`, err?.message || err);
}

import { Router } from "express";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import pool from "../utils/db.mjs";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const BUCKET_NAME = "my-personal-blog";
const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

const signupRouter = Router();

// GET /api/signup/check?username=xxx — ใช้เช็ค username ซ้ำก่อนสมัคร (สำหรับ client-side validation)
signupRouter.get("/check", async (req, res) => {
  const username = typeof req.query.username === "string" ? req.query.username.trim() : "";
  try {
    let usernameTaken = false;
    if (username) {
      const { rows } = await pool.query(
        "SELECT 1 FROM users WHERE username = $1 LIMIT 1",
        [username]
      );
      usernameTaken = rows.length > 0;
    }
    return res.status(200).json({ usernameTaken });
  } catch (err) {
    console.error("Signup check error:", err);
    return res.status(500).json({ usernameTaken: false });
  }
});

signupRouter.post("/", async (req, res) => {
  const body = req.body ?? {};
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }

  try {
    const usernameCheckQuery = `
      SELECT * FROM users
      WHERE username = $1
    `;
    const { rows: existingUser } = await pool.query(usernameCheckQuery, [username]);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: "This username is already taken" });
    }

    const { data, error: supabaseError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (supabaseError) {
      if (supabaseError.code === "user_already_exists") {
        return res
          .status(400)
          .json({ error: "User with this email already exists" });
      }
      return res.status(400).json({
        error: supabaseError.message || "Failed to create user. Please try again.",
      });
    }

    const supabaseUserId = data.user.id;
    const query = `
      INSERT INTO users (id, username, name, role)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [supabaseUserId, username, name, "user"]);
    res.status(201).json({
      message: "User created successfully",
      user: rows[0],
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "An error occurred during registration" });
  }
});

const loginRouter = Router();
loginRouter.post("/", async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      if (
        error.code === "invalid_credentials" ||
        error.message.includes("Invalid login credentials")
      ) {
        return res.status(400).json({
          error: "Your password is incorrect or this email doesn't exist",
        });
      }
      return res.status(400).json({ error: error.message });
    }
    return res.status(200).json({
      message: "Signed in successfully",
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      data: data,
    });
  } catch (error) {
    return res.status(500).json({ error: "An error occurred during login" });
  }
});

const getUserRouter = Router();
getUserRouter.get("/", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Token missing" });
  }
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error) {
      return res.status(401).json({ error: "Unauthorized or token expired" });
    }
    const supabaseUserId = data.user.id;
    const query = `
      SELECT * FROM users
      WHERE id = $1
    `;
    const values = [supabaseUserId];
    const { rows } = await pool.query(query, values);
    res.status(200).json({
      id: data.user.id,
      email: data.user.email,
      username: rows[0].username,
      name: rows[0].name,
      role: rows[0].role,
      profilePic: rows[0].profile_pic,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

const resetPasswordRouter = Router();
resetPasswordRouter.put("/", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const { oldPassword, newPassword } = req.body;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Token missing" });
  }
  if (!newPassword) {
    return res.status(400).json({ error: "New password is required" });
  }
  try {
    const { data: userData, error: getUserError } = await supabase.auth.getUser(token);
    if (getUserError || !userData?.user) {
      return res.status(401).json({ error: "Unauthorized or token expired" });
    }
    const email = userData.user.email;

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password: oldPassword,
    });
    if (loginError) {
      return res.status(400).json({ error: "Invalid old password" });
    }
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/** POST /api/upload-profile-image — อัปโหลดรูปโปรไฟล์ไป Supabase Storage แล้วคืน public URL (ยังไม่อัปเดต DB; client ส่ง URL ต่อใน PUT /api/update-profile) */
const uploadProfileImageRouter = Router();
uploadProfileImageRouter.post(
  "/",
  multerUpload.single("imageFile"),
  async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: Token missing" });
    }
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No image file provided (field name: imageFile)" });
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return res.status(400).json({
        error: "Invalid file type. Use JPEG, PNG, GIF, or WebP.",
      });
    }
    try {
      const { data: userData, error: getUserError } = await supabase.auth.getUser(token);
      if (getUserError || !userData?.user) {
        return res.status(401).json({ error: "Unauthorized or token expired" });
      }
      const userId = userData.user.id;
      const ext =
        file.originalname?.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "jpg";
      const filePath = `profiles/${userId}/${Date.now()}.${ext}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });
      if (uploadError) {
        console.error("Profile image upload error:", uploadError);
        return res.status(500).json({ error: "Failed to upload image" });
      }
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(uploadData.path);
      return res.status(200).json({ profilePic: urlData.publicUrl });
    } catch (error) {
      console.error("upload-profile-image error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

const updateProfileRouter = Router();
updateProfileRouter.put("/", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Token missing" });
  }
  const body = req.body ?? {};
  const name = typeof body.name === "string" ? body.name.trim() : null;
  const username = typeof body.username === "string" ? body.username.trim() : null;
  const profilePic = body.profilePic ?? body.profile_pic ?? null;

  if (!name && !username && profilePic === null) {
    return res.status(400).json({ error: "Provide at least one field to update: name, username, or profilePic" });
  }
  try {
    const { data: userData, error: getUserError } = await supabase.auth.getUser(token);
    if (getUserError || !userData?.user) {
      return res.status(401).json({ error: "Unauthorized or token expired" });
    }
    const supabaseUserId = userData.user.id;

    if (username !== null) {
      const { rows: existing } = await pool.query(
        "SELECT 1 FROM users WHERE username = $1 AND id != $2 LIMIT 1",
        [username, supabaseUserId]
      );
      if (existing.length > 0) {
        return res.status(400).json({ error: "This username is already taken" });
      }
    }

    const updates = [];
    const values = [];
    let idx = 1;
    if (name !== null) {
      updates.push(`name = $${idx++}`);
      values.push(name);
    }
    if (username !== null) {
      updates.push(`username = $${idx++}`);
      values.push(username);
    }
    if (profilePic !== null) {
      updates.push(`profile_pic = $${idx++}`);
      values.push(profilePic);
    }
    if (updates.length === 0) {
      return res.status(400).json({ error: "Nothing to update" });
    }
    values.push(supabaseUserId);
    const query = `
      UPDATE users
      SET ${updates.join(", ")}
      WHERE id = $${idx}
      RETURNING *;
    `;
    const { rows } = await pool.query(query, values);
    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = rows[0];
    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        profilePic: user.profile_pic,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default {
  signup: signupRouter,
  login: loginRouter,
  getUser: getUserRouter,
  resetPassword: resetPasswordRouter,
  uploadProfileImage: uploadProfileImageRouter,
  updateProfile: updateProfileRouter,
};
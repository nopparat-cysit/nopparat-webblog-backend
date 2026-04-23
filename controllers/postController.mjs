import postService from "../services/postService.mjs";
import pool from "../utils/db.mjs";
import { createClient } from "@supabase/supabase-js";
import {
  PUBLISHED_STATUS_ID,
  createNotificationsForUsers,
  getMemberUserIds,
  logNotificationError,
} from "../services/notificationService.mjs";
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
const BUCKET_NAME = "my-personal-blog";

const postController = {
  create: async (req, res) => {
    const newPost = { ...req.body };
    const file = req.files?.imageFile?.[0];

    try {
      let category_id = newPost.category_id;
      if (category_id !== undefined && category_id !== null) {
        category_id = parseInt(category_id, 10);
      }
      if (!category_id && newPost.category) {
        const catResult = await pool.query(
          `SELECT id FROM categories WHERE name = $1`,
          [newPost.category],
        );
        if (catResult.rows.length === 0) {
          return res
            .status(400)
            .json({ message: `Category '${newPost.category}' not found` });
        }
        category_id = catResult.rows[0].id;
      }
      if (category_id === undefined || Number.isNaN(category_id)) {
        return res.status(400).json({ message: "Category ID is required" });
      }

      const status_id = parseInt(newPost.status_id, 10);
      if (Number.isNaN(status_id)) {
        return res.status(400).json({ message: "Status ID is required" });
      }

      // Upload image to Supabase Storage
      const filePath = `posts/${Date.now()}_${file.originalname}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });
      if (uploadError) {
        throw uploadError;
      }
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(uploadData.path);
      const publicUrl = urlData.publicUrl;
      const authorId = req.user?.id ?? null;

      const result = await pool.query(
        `
            INSERT INTO posts (image, category_id, title, description, content, status_id, date, likes_count, author_id)
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), 0, $7)
            RETURNING *;
            `,
        [
          publicUrl,
          category_id,
          newPost.title.trim(),
          newPost.description.trim(),
          newPost.content.trim(),
          status_id,
          authorId,
        ],
      );

      const post = result.rows[0];
      if (status_id === PUBLISHED_STATUS_ID) {
        try {
          const memberIds = await getMemberUserIds();
          const authorNameRow = authorId
            ? await pool.query("SELECT name FROM users WHERE id = $1", [authorId])
            : { rows: [] };
          const authorName = authorNameRow.rows[0]?.name ?? "Admin";
          const targets = memberIds.filter((id) => id !== authorId);
          if (targets.length > 0) {
            await createNotificationsForUsers(targets, {
              type: "new_article",
              message: `New article: "${post.title}"`,
              meta: {
                user_name: authorName,
                article_id: String(post.id),
                article_title: post.title,
                article_cover: post.image ?? null,
              },
            });
          }
        } catch (e) {
          logNotificationError("create post → members", e);
        }
      }

      return res.status(201).json({
        message: "Post created successfully",
        data: post,
      });
    } catch (error) {
      console.error("Create post error:", error);
      return res.status(500).json({
        message: "Server could not create post",
        error: error.message,
      });
    }
  },
  update: async (req, res) => {
    const newPost = { ...req.body };
    const { postId } = req.params;
    const file = req.files?.imageFile?.[0];

    try {
      let imageUrl = newPost.image;
      if (file?.buffer) {
        const filePath = `posts/${Date.now()}_${file.originalname}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
          });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(uploadData.path);
        imageUrl = urlData.publicUrl;
      }

      const category_id = parseInt(newPost.category_id, 10);
      const status_id = parseInt(newPost.status_id, 10);
      if (Number.isNaN(category_id) || Number.isNaN(status_id)) {
        return res.status(400).json({ message: "Category ID and Status ID must be numbers" });
      }

      const prevRow = await pool.query("SELECT status_id, title, author_id FROM posts WHERE id = $1", [postId]);
      const oldStatus = prevRow.rows[0]?.status_id;
      const authorId = prevRow.rows[0]?.author_id ?? null;

      const result = await pool.query(
        `
        UPDATE posts
        SET image = $1,
            category_id = $2,
            title = $3,
            description = $4,
            content = $5,
            status_id = $6,
            date = NOW()
        WHERE id = $7
        RETURNING *;
        `,
        [
          imageUrl,
          category_id,
          newPost.title.trim(),
          newPost.description.trim(),
          newPost.content.trim(),
          status_id,
          postId,
        ],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Post not found",
          param: postId,
        });
      }

      const updated = result.rows[0];
      if (status_id === PUBLISHED_STATUS_ID && oldStatus !== PUBLISHED_STATUS_ID) {
        try {
          const memberIds = await getMemberUserIds();
          const authorNameRow = authorId
            ? await pool.query("SELECT name FROM users WHERE id = $1", [authorId])
            : { rows: [] };
          const authorName = authorNameRow.rows[0]?.name ?? "Admin";
          const targets = memberIds.filter((id) => id !== authorId);
          if (targets.length > 0) {
            await createNotificationsForUsers(targets, {
              type: "new_article",
              message: `New article: "${updated.title}"`,
              meta: {
                user_name: authorName,
                article_id: String(updated.id),
                article_title: updated.title,
                article_cover: updated.image ?? null,
              },
            });
          }
        } catch (e) {
          logNotificationError("update post → publish → members", e);
        }
      }

      return res.status(200).json({
        message: "Updated post successfully",
        data: updated,
      });
    } catch (error) {
      console.error("Update post error:", error);
      return res.status(500).json({
        message: "Server could not update post",
        error: error.message,
      });
    }
  },
  readAll: async (req, res) => {
    try {
        const { limit , page , category, status_id } = req.query
        const result = await postService.readAll({
          limit: parseInt(limit) || 6,
          page: parseInt(page) || 1,
          category,
          status_id: status_id != null && status_id !== '' ? parseInt(status_id, 10) : undefined,
        })
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({
            message: "Server could not read post because database connection",
            error: error.message,
          });
    }
  },
  readById: () => {},
  delete: () => {},
};

export default postController;

import { Router } from "express";
import pool from "../utils/db.mjs";
import postValidation from "../middlewares/post.validateion.mjs";
import postController from "../controllers/postController.mjs";
import protectAdmin from "../middlewares/protectAdmin.mjs";
import protectUser from "../middlewares/protectUser.mjs";
import multer from "multer";
import { createNotification, logNotificationError } from "../services/notificationService.mjs";

const postRoute = Router();
const multerUpload = multer({ storage: multer.memoryStorage() });
const imageFileUpload = multerUpload.fields([
  { name: "imageFile", maxCount: 1 },
]);

// create post (multipart: imageFile + body fields)
postRoute.post("/", [imageFileUpload, protectAdmin, postValidation.create, postController.create]);

// update post (admin only; multipart optional: imageFile + body fields)
postRoute.put("/:postId", [imageFileUpload, protectAdmin, postValidation.update, postController.update]);

// read all post
postRoute.get("/", [postController.readAll]);

// read one post
 postRoute.get("/:postId", [postValidation.readById],async (req, res) => {
  const { postId } = req.params;

  try {
    const result = await pool.query(`SELECT posts.*, categories.name AS category FROM posts INNER JOIN categories ON categories.id = posts.category_id WHERE posts.id = $1` , [postId]);
    return res.status(200).json({ data: result.rows[0] });
  } catch (error) {
    return res.status(500).json({
      message: "Server could not read post because database connection",
      error: error.message,
    });
  }
});

// delete post (and its likes & comments)
postRoute.delete("/:postId", [postValidation.delete], async (req, res) => {
  const { postId } = req.params;

  try {
    await pool.query("BEGIN");

    // delete related comments and likes first
    await pool.query("DELETE FROM comments WHERE post_id = $1", [postId]);
    await pool.query("DELETE FROM likes WHERE post_id = $1", [postId]);

    const result = await pool.query(
      "DELETE FROM posts WHERE id = $1 RETURNING *",
      [postId],
    );

    await pool.query("COMMIT");

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Post not found" });
    }

    return res.status(200).json({
      message: "Deleted post sucessfully",
      data: result.rows[0],
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    return res.status(500).json({
      message: "Server could not delete post because database connection",
      error: error.message,
    });
  }
});

// like a post
postRoute.post("/:postId/likes", [protectUser], async (req, res) => {
  const { postId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized: user not found in request" });
  }

  try {
    await pool.query("BEGIN");

    const existing = await pool.query(
      "SELECT id FROM likes WHERE post_id = $1 AND user_id = $2",
      [postId, userId],
    );

    let alreadyLiked = existing.rows.length > 0;

    if (!alreadyLiked) {
      await pool.query(
        "INSERT INTO likes (post_id, user_id, liked_at) VALUES ($1, $2, NOW())",
        [postId, userId],
      );
      await pool.query(
        "UPDATE posts SET likes_count = likes_count + 1 WHERE id = $1",
        [postId],
      );

      try {
        const postRow = await pool.query(
          "SELECT author_id, title FROM posts WHERE id = $1",
          [postId],
        );
        const authorId = postRow.rows[0]?.author_id;
        if (authorId && authorId !== userId) {
          const likerRow = await pool.query(
            "SELECT name, role, profile_pic FROM users WHERE id = $1",
            [userId],
          );
          const liker = likerRow.rows[0];
          if (liker?.role === "user") {
            const likerName = liker.name ?? "Member";
            await createNotification({
              user_id: authorId,
              type: "like",
              message: `${likerName} liked your article`,
              meta: {
                user_name: likerName,
                avatar: liker.profile_pic ?? null,
                article_id: String(postId),
                article_title: postRow.rows[0]?.title ?? "",
              },
            });
          }
        }
      } catch (e) {
        logNotificationError("like post", e);
      }
    }

    const { rows } = await pool.query(
      "SELECT likes_count FROM posts WHERE id = $1",
      [postId],
    );

    await pool.query("COMMIT");

    return res.status(200).json({
      message: alreadyLiked ? "Post already liked" : "Post liked successfully",
      likes_count: rows[0]?.likes_count ?? null,
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    return res.status(500).json({
      message: "Server could not like post",
      error: error.message,
    });
  }
});

// unlike a post
postRoute.delete("/:postId/likes", [protectUser], async (req, res) => {
  const { postId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized: user not found in request" });
  }

  try {
    await pool.query("BEGIN");

    const deleteResult = await pool.query(
      "DELETE FROM likes WHERE post_id = $1 AND user_id = $2 RETURNING id",
      [postId, userId],
    );

    if (deleteResult.rows.length > 0) {
      await pool.query(
        "UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = $1",
        [postId],
      );
    }

    const { rows } = await pool.query(
      "SELECT likes_count FROM posts WHERE id = $1",
      [postId],
    );

    await pool.query("COMMIT");

    if (deleteResult.rows.length === 0) {
      return res.status(404).json({
        message: "Like not found for this user and post",
        likes_count: rows[0]?.likes_count ?? null,
      });
    }

    return res.status(200).json({
      message: "Unliked post successfully",
      likes_count: rows[0]?.likes_count ?? null,
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    return res.status(500).json({
      message: "Server could not unlike post",
      error: error.message,
    });
  }
});

export default postRoute;

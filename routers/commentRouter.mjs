import { Router } from "express";
import pool from "../utils/db.mjs";
import protectUser from "../middlewares/protectUser.mjs";
import { createNotification, logNotificationError } from "../services/notificationService.mjs";

const commentRoute = Router();

const COMMENTS_LIMIT = 5;

// get comments of a post (paginated)
commentRoute.get("/:postId/comments", async (req, res) => {
  const { postId } = req.params;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const offset = (page - 1) * COMMENTS_LIMIT;

  try {
    const [dataResult, countResult] = await Promise.all([
      pool.query(
        `SELECT comments.*, users.name AS user_name, users.profile_pic AS user_profile_pic
         FROM comments
         INNER JOIN users ON users.id = comments.user_id
         WHERE comments.post_id = $1
         ORDER BY comments.created_at DESC
         LIMIT $2 OFFSET $3`,
        [postId, COMMENTS_LIMIT, offset],
      ),
      pool.query(
        "SELECT COUNT(*)::int AS total FROM comments WHERE post_id = $1",
        [postId],
      ),
    ]);

    const total = countResult.rows[0]?.total ?? 0;
    const totalPages = Math.ceil(total / COMMENTS_LIMIT);

    return res.status(200).json({
      data: dataResult.rows,
      pagination: {
        page,
        limit: COMMENTS_LIMIT,
        total,
        totalPages,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server could not get comments",
      error: error.message,
    });
  }
});

// add comment to a post
commentRoute.post("/:postId/comments", [protectUser], async (req, res) => {
  const { postId } = req.params;
  const userId = req.user?.id;
  const { comment_text } = req.body;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized: user not found in request" });
  }

  if (!comment_text || !comment_text.trim()) {
    return res.status(400).json({ message: "comment_text is required" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO comments (post_id, user_id, comment_text, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *",
      [postId, userId, comment_text.trim()],
    );

    const commentRow = result.rows[0];
    const { rows: commenterRows } = await pool.query(
      "SELECT name, username, profile_pic FROM users WHERE id = $1",
      [userId],
    );
    const commenter = commenterRows[0] ?? {};

    try {
      const postRow = await pool.query(
        "SELECT author_id, title FROM posts WHERE id = $1",
        [postId],
      );
      const authorId = postRow.rows[0]?.author_id;
      if (authorId && authorId !== userId) {
        const roleRow = await pool.query(
          "SELECT name, role FROM users WHERE id = $1",
          [userId],
        );
        const member = roleRow.rows[0];
        if (member?.role === "user") {
          const commenterName = member.name ?? "Member";
          await createNotification({
            user_id: authorId,
            type: "comment",
            message: `${commenterName} commented on your article`,
            meta: {
              user_name: commenterName,
              avatar: commenter.profile_pic ?? null,
              article_id: String(postId),
              article_title: postRow.rows[0]?.title ?? "",
              comment_text: comment_text.trim().slice(0, 200),
            },
          });
        }
      }
    } catch (e) {
      logNotificationError("comment post", e);
    }

    return res.status(201).json({
      message: "Comment created successfully",
      data: {
        ...commentRow,
        user_name: commenter.name ?? null,
        user_profile_pic: commenter.profile_pic ?? null,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server could not create comment",
      error: error.message,
    });
  }
});

// delete a comment from a post
commentRoute.delete("/:postId/comments/:commentId", [protectUser], async (req, res) => {
  const { postId, commentId } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized: user not found in request" });
  }

  try {
    const commentResult = await pool.query(
      "SELECT * FROM comments WHERE id = $1 AND post_id = $2",
      [commentId, postId],
    );

    if (commentResult.rows.length === 0) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (commentResult.rows[0].user_id !== userId) {
      return res.status(403).json({
        message: "You are not allowed to delete this comment",
      });
    }

    const deleteResult = await pool.query(
      "DELETE FROM comments WHERE id = $1 RETURNING *",
      [commentId],
    );

    return res.status(200).json({
      message: "Deleted comment successfully",
      data: deleteResult.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server could not delete comment",
      error: error.message,
    });
  }
});

export default commentRoute;

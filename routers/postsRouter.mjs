import { Router } from "express";
import pool from "../utils/db.mjs";
import createPostValidation from "../middlewares/createPost.validation.mjs";
import updatePostValidation from "../middlewares/updatePost.validation.mjs";
const postRoute = Router();

// create post
postRoute.post("/", [createPostValidation], async (req, res) => {
  const newPost = { ...req.body };

  try {
    const result = await pool.query(
      `
      INSERT INTO posts (image, category_id, title, description, content, status_id, date, likes_count)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), 0)
      RETURNING *;
      `,
      [
        newPost.image,
        newPost.category_id,
        newPost.title,
        newPost.description,
        newPost.content,
        newPost.status_id,
      ],
    );

    return res.status(201).json({
      message: "Post created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server could not create post because database connection",
      error: error.message,
    });
  }
});

// update post
postRoute.put("/:postId",[updatePostValidation], async (req, res) => {
  const newPost = { ...req.body };
  const { postId } = req.params;

  try {
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
        newPost.image,
        newPost.category_id,
        newPost.title,
        newPost.description,
        newPost.content,
        newPost.status_id,
        postId,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Post not found",
        param: postId,
      });
    }

    return res.status(200).json({
      message: "Updated post sucessfully",
      data: result.rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server could not update post because database connection",
      error: error.message,
    });
  }
});

// read all post
postRoute.get("/", async (req, res) => {
  const limit = 6;
  const page = parseInt(req.query.page) || 1;
  const offset = (page - 1) * limit;
  try {
    // get total posts
    const totalResult = await pool.query(`SELECT COUNT(*) FROM posts`);
    const totalPosts = parseInt(totalResult.rows[0].count);
    const totalPages = Math.ceil(totalPosts / limit);
    // get paginated posts
    const result = await pool.query(`SELECT posts.*, categories.name AS category FROM posts INNER JOIN categories ON categories.id = posts.category_id ORDER BY posts.id DESC LIMIT $1 OFFSET $2`, [limit, offset]);
    return res.status(200).json({
      data: result.rows,
      totalPosts,
      totalPages,
      currentPage: page,
      limit
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server could not read post because database connection",
      error: error.message,
    });
  }
});

// read one post
 postRoute.get("/:postId", async (req, res) => {
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

// delete post
postRoute.delete("/:postId", async (req, res) => {
  const { postId } = req.params;

  try {
    const result = await pool.query(`DELETE FROM posts WHERE id = $1 RETURNING *` , [postId]);
    return res.status(200).json({ message:"Deleted post sucessfully" , data: result.rows[0] });
  } catch (error) {
    return res.status(500).json({
      message: "Server could not read post because database connection",
      error: error.message,
    });
  }
});
export default postRoute;

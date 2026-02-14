import { Router } from "express";
import pool from "../utils/db.mjs";
import postValidation from "../middlewares/post.validateion.mjs";
import postController from "../controllers/postController.mjs";
const postRoute = Router();

// create post
postRoute.post("/", [postValidation.create], [postController.create]);

// update post
postRoute.put("/:postId",[postValidation.update], [postController.update]);

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

// delete post
postRoute.delete("/:postId",[postValidation.delete], async (req, res) => {
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

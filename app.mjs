import "dotenv/config";
import express from "express";
import cors from "cors";
import pool from "./utils/db.mjs";
import createPostValodation from "./middlewares/createPost.validation.mjs";

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.post("/post",[createPostValodation],async (req, res) => {
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
      ]
    );

    return res.status(201).json({
      message: "Post created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.log("DB Password Check:", process.env.DB_PASSWORD);
    return res.status(500).json({
      message: "Server could not create post because database connection",
      error: error.message,
    });
  }
});


app.listen(port, () => {
  console.log(`Server is running at ${port}`);
});

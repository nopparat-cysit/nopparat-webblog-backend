import "dotenv/config";
import express from "express";
import cors from "cors";
import pool from "./utils/db.mjs";
import createPostValodation from "./middlewares/createPost.validation.mjs";

const app = express();
const port = process.env.PORT || 4000;
const cors = require("cors"); // นำเข้า cors
app.use(cors()); // อนุญาตให้ทุกโดเมนเข้าถึงได้
app.use(express.json());
app.use(
    cors({
      origin: [
        "http://localhost:5173", // Frontend local (Vite)
        "http://localhost:3000", // Frontend local (React แบบอื่น)
        "https://nopparat-webblog.vercel.app", // Frontend ที่ Deploy แล้ว
        // ✅ ให้เปลี่ยน https://your-frontend.vercel.app เป็น URL จริงของ Frontend ที่ deploy แล้ว
      ],
    })
  );


app.get("/health", async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM posts`);
    return res.json({ message: "success select", data: result.rows });
  } catch (error) {
    return res.status(500).json({ message: "error naja" });
  }
});

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

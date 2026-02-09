import "dotenv/config";
import express from "express";
import cors from "cors";
import postRouter from "./routers/postsRouter.mjs";

const app = express();
const port = process.env.PORT || 4000;

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
app.use("/posts", postRouter)
// app.get("/health", async (req, res) => {
//   try {
//     const result = await pool.query(`SELECT * FROM posts`);
//     return res.json({ message: "success select", data: result.rows });
//   } catch (error) {
//     return res.status(500).json({ message: "error naja" });
//   }
// });


app.listen(port, () => {
  console.log(`Server is running at ${port}`);
});

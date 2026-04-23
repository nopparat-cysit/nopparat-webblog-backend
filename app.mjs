import "dotenv/config";
import express from "express";
import cors from "cors";
import postRouter from "./routers/postsRouter.mjs";
import commentRouter from "./routers/commentRouter.mjs";
import categoriesRouter from "./routers/categoriesRouter.mjs";
import authRoute from "./routers/auth.mjs";

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
  }),
);
app.use("/posts", commentRouter);
app.use("/posts", postRouter);
app.use("/categories", categoriesRouter);
app.use("/api/signup", authRoute.signup);
app.use("/api/login", authRoute.login);
app.use("/get-user", authRoute.getUser);
app.use("/api/reset-password", authRoute.resetPassword);
app.use("/api/upload-profile-image", authRoute.uploadProfileImage);
app.use("/api/update-profile", authRoute.updateProfile);
export default app;

if (process.env.VERCEL !== "1") {
  app.listen(port, () => {
    console.log(`✅ Server running on http://localhost:${port}`);
  });
}

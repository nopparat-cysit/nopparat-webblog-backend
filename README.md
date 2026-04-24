🖥️ Nopparat Web Blog — Backend
![Node.js](https://img.shields.io/badge/Node.js-ESM-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
> REST API backend for Nopparat Web Blog — handles posts, comments, categories, and user authentication.
🌐 API Base URL: nopparat-webblog-backend.vercel.app
---
✨ Features
📝 Full CRUD for blog posts
💬 Comment system per post
🏷️ Category management
🔐 Authentication via Supabase (Sign up / Login / Reset Password)
👤 Profile update and avatar upload with Multer
🌐 CORS configured for local and production frontend
---
🛠️ Tech Stack
Category	Technology
Runtime	Node.js (ES Modules)
Framework	Express 5
Database	PostgreSQL (via `pg`)
Auth & Storage	Supabase JS
File Upload	Multer
Environment	dotenv
Dev Server	Nodemon
Deployment	Vercel (Serverless)
---
📁 Project Structure
```
nopparat-webblog-backend/
├── controllers/        # Request handlers (business logic)
├── middlewares/        # Auth & validation middleware
├── repositories/       # Database query layer
├── routers/            # Route definitions
│   ├── postsRouter.mjs
│   ├── commentRouter.mjs
│   ├── categoriesRouter.mjs
│   └── auth.mjs
├── services/           # Service layer
├── utils/              # Helper utilities
├── app.mjs             # App entry point
└── vercel.json         # Vercel serverless config
```
---
📡 API Endpoints
🔐 Auth
Method	Endpoint	Description
`POST`	`/api/signup`	Register a new user
`POST`	`/api/login`	Login with email & password
`GET`	`/get-user`	Get current user info
`POST`	`/api/reset-password`	Send password reset email
`POST`	`/api/upload-profile-image`	Upload profile avatar
`PUT`	`/api/update-profile`	Update user profile
📝 Posts
Method	Endpoint	Description
`GET`	`/posts`	Get all posts
`GET`	`/posts/:id`	Get a post by ID
`POST`	`/posts`	Create a new post
`PUT`	`/posts/:id`	Update a post
`DELETE`	`/posts/:id`	Delete a post
💬 Comments
Method	Endpoint	Description
`GET`	`/posts/:id/comments`	Get comments for a post
`POST`	`/posts/:id/comments`	Add a comment to a post
🏷️ Categories
Method	Endpoint	Description
`GET`	`/categories`	Get all categories
---
🚀 Getting Started
Prerequisites
Node.js `>= 18`
npm `>= 9`
A PostgreSQL database (via Supabase or self-hosted)
1. Clone the repository
```bash
git clone https://github.com/nopparat-cysit/nopparat-webblog-backend.git
cd nopparat-webblog-backend
```
2. Install dependencies
```bash
npm install
```
3. Configure environment variables
Create a `.env` file at the root of the project:
```env
PORT=4000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
DATABASE_URL=your_postgresql_connection_string
```
4. Start the development server
```bash
npm start
```
Server will run at http://localhost:4000
---
📜 Available Scripts
Command	Description
`npm start`	Start dev server with Nodemon (auto-reload)
---
🌍 Deployment
This project is deployed as a Vercel Serverless Function. The `vercel.json` routes all requests through `app.mjs`. The `app.listen()` call is skipped automatically when running on Vercel (`process.env.VERCEL === "1"`).
---
🔗 Related
	
Frontend Repository	nopparat-webblog
Frontend Demo	nopparat-webblog.vercel.app

import postService from "../services/postService.mjs";

const postController = {
  create: async (req, res) => {
    const newPost = { ...req.body };

    try {
      let category_id = newPost.category_id;
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

      const result = await pool.query(
        `
            INSERT INTO posts (image, category_id, title, description, content, status_id, date, likes_count)
            VALUES ($1, $2, $3, $4, $5, $6, NOW(), 0)
            RETURNING *;
            `,
        [
          newPost.image,
          category_id,
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
  },
  update: async (req, res) => {
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
  },
  readAll: async (req, res) => {
    try {
        const { limit , page , category } = req.query
        const result = await postService.readAll({ limit: parseInt(limit) || 6, page: parseInt(page) || 1, category })
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

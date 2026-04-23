import "dotenv/config";

const postValidation = {
  create: async (req, res, next) => {
    const newPost = { ...req.body };

    // Validate image file (multipart upload)
    const file = req.files?.imageFile?.[0];
    if (!file || !file.buffer) {
      return res.status(400).json({ message: "Image file is required (field: imageFile)" });
    }

    // Validate title
    if (!newPost.title || typeof newPost.title !== "string") {
      return res.status(400).json({ message: "Title is required and must be a string" });
    }
    if (!newPost.title.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    // Validate description
    if (!newPost.description || typeof newPost.description !== "string") {
      return res.status(400).json({ message: "Description is required and must be a string" });
    }

    // Validate content
    if (!newPost.content || typeof newPost.content !== "string") {
      return res.status(400).json({ message: "Content is required and must be a string" });
    }

    // Validate category_id (can be string from form)
    const categoryId = newPost.category_id;
    if (categoryId === undefined || categoryId === null || categoryId === "") {
      return res.status(400).json({ message: "Category ID is required" });
    }
    const parsedCategoryId = parseInt(categoryId, 10);
    if (Number.isNaN(parsedCategoryId)) {
      return res.status(400).json({ message: "Category ID must be a number" });
    }

    // Validate status_id (can be string from form)
    const statusId = newPost.status_id;
    if (statusId === undefined || statusId === null || statusId === "") {
      return res.status(400).json({ message: "Status ID is required" });
    }
    const parsedStatusId = parseInt(statusId, 10);
    if (Number.isNaN(parsedStatusId)) {
      return res.status(400).json({ message: "Status ID must be a number" });
    }

    next();
  },
  update: async (req, res, next) => {
    const newPost = { ...req.body };
    const hasImageFile = req.files?.imageFile?.[0]?.buffer;

    // Image: either new file upload or existing URL in body
    if (!hasImageFile) {
      if (!newPost.image || typeof newPost.image !== "string") {
        return res.status(400).json({ message: "Image is required (imageFile or image URL)" });
      }
    }

    // Validate title
    if (!newPost.title || typeof newPost.title !== "string" || !newPost.title.trim()) {
      return res.status(400).json({ message: "Title is required and must be a string" });
    }

    // Validate description
    if (!newPost.description || typeof newPost.description !== "string") {
      return res.status(400).json({ message: "Description is required and must be a string" });
    }

    // Validate content
    if (!newPost.content || typeof newPost.content !== "string") {
      return res.status(400).json({ message: "Content is required and must be a string" });
    }

    // Validate category_id (can be string from form)
    const categoryId = newPost.category_id;
    if (categoryId === undefined || categoryId === null || categoryId === "") {
      return res.status(400).json({ message: "Category ID is required" });
    }
    if (Number.isNaN(parseInt(categoryId, 10))) {
      return res.status(400).json({ message: "Category ID must be a number" });
    }

    // Validate status_id (can be string from form)
    const statusId = newPost.status_id;
    if (statusId === undefined || statusId === null || statusId === "") {
      return res.status(400).json({ message: "Status ID is required" });
    }
    if (Number.isNaN(parseInt(statusId, 10))) {
      return res.status(400).json({ message: "Status ID must be a number" });
    }

    next();
  },
  readById: async (req, res, next) => {
    const { postId } = req.params;
    if (!postId) {
        return res.status(400).json({ message: "Post ID is required" });
    }

    next();
  },
  delete: async (req, res, next) => {
    const { postId } = req.params;
    if (!postId) {
        return res.status(400).json({ message: "Post ID is required" });
    }

    next();
  },
};

export default postValidation;

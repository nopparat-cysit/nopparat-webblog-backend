import "dotenv/config";

const updatePostValidation = async (req, res, next) => {
  const newPost = { ...req.body };

  // Validate title
  if (!newPost.title) {
    return res.status(400).json({ message: "Title is required" });
  }
  if (typeof newPost.title !== "string") {
    return res.status(400).json({ message: "Title must be a string" });
  }

  // Validate image
  if (!newPost.image) {
    return res.status(400).json({ message: "Image is required" });
  }
  if (typeof newPost.image !== "string") {
    return res.status(400).json({ message: "Image must be a string" });
  }

  // Validate description
  if (!newPost.description) {
    return res.status(400).json({ message: "Description is required" });
  }
  if (typeof newPost.description !== "string") {
    return res.status(400).json({ message: "Description must be a string" });
  }

  // Validate content
  if (!newPost.content) {
    return res.status(400).json({ message: "Content is required" });
  }
  if (typeof newPost.content !== "string") {
    return res.status(400).json({ message: "Content must be a string" });
  }

  // Validate category_id
  if (newPost.category_id === undefined || newPost.category_id === null) {
    return res.status(400).json({ message: "Category ID is required" });
  }
  if (typeof newPost.category_id !== "number") {
    return res.status(400).json({ message: "Category ID must be a number" });
  }

  // Validate status_id
  if (newPost.status_id === undefined || newPost.status_id === null) {
    return res.status(400).json({ message: "Status ID is required" });
  }
  if (typeof newPost.status_id !== "number") {
    return res.status(400).json({ message: "Status ID must be a number" });
  }

  next();
};

export default updatePostValidation;
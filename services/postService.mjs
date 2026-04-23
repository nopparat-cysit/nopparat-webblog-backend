import postRepository from "../repositories/postRepository.mjs";

const postService = {
  readAll: async ({ page, limit, category, status_id }) => {
    const safeLimit = limit > 0 ? limit : 6;
    const safePage = page > 0 ? page : 1;
    const offset = (safePage - 1) * safeLimit;

    const { totalPosts, result } = await postRepository.readAll({ limit: safeLimit, category, status_id, offset });
    const totalPages = Math.ceil(totalPosts / safeLimit);
    const nextPage = safePage < totalPages ? safePage + 1 : null;

    return {
      totalPosts,
      totalPages,
      currentPage: safePage,
      limit: safeLimit,
      posts: result.rows,
      nextPage,
    };
  },
};

export default postService;

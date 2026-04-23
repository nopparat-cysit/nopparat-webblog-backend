import pool from "../utils/db.mjs";
const postRepository = {
    readAll: async ({ limit, category, offset }) => {
        let totalResult, result;
        if (category) {
            totalResult = await pool.query(
                `SELECT COUNT(*) FROM posts INNER JOIN categories ON categories.id = posts.category_id WHERE LOWER(categories.name) = LOWER($1)`,
                [category]
            );
            result = await pool.query(
                `SELECT posts.*, categories.name AS category FROM posts INNER JOIN categories ON categories.id = posts.category_id WHERE LOWER(categories.name) = LOWER($1) ORDER BY posts.id DESC LIMIT $2 OFFSET $3`,
                [category, limit, offset]
            );
        } else {
            totalResult = await pool.query(`SELECT COUNT(*) FROM posts`);
            result = await pool.query(
                `SELECT posts.*, categories.name AS category FROM posts INNER JOIN categories ON categories.id = posts.category_id ORDER BY posts.id DESC LIMIT $1 OFFSET $2`,
                [limit, offset]
            );
        }
        return { totalPosts: parseInt(totalResult.rows[0].count) , result };
    },
}
export default postRepository
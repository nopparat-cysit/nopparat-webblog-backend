import pool from "../utils/db.mjs";
const postRepository = {
    readAll: async ({ limit, category, status_id, offset }) => {
        const conditions = [];
        const params = [];
        let paramIndex = 1;

        if (category) {
            conditions.push(`LOWER(categories.name) = LOWER($${paramIndex})`);
            params.push(category);
            paramIndex += 1;
        }
        if (status_id != null && !Number.isNaN(status_id)) {
            conditions.push(`posts.status_id = $${paramIndex}`);
            params.push(status_id);
            paramIndex += 1;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const countSql = `SELECT COUNT(*) FROM posts INNER JOIN categories ON categories.id = posts.category_id ${whereClause}`;
        const totalResult = await pool.query(countSql, params);
        const totalPosts = parseInt(totalResult.rows[0].count);

        params.push(limit, offset);
        const listSql = `SELECT posts.*, categories.name AS category FROM posts INNER JOIN categories ON categories.id = posts.category_id ${whereClause} ORDER BY posts.id DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        const result = await pool.query(listSql, params);

        return { totalPosts, result };
    },
}
export default postRepository
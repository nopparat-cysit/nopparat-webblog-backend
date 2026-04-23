import { Router } from "express";
import pool from "../utils/db.mjs";
import categoryValidation from "../middlewares/categories.validateion.mjs";

const categoriesRoute = Router();

//get gategories
categoriesRoute.get("/" , async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM categories`)
        return res.status(200).json({ data: result.rows})
    } catch (error) {
        return res.status(500).json({
            message: "Server could not read categories because database connection",
            error: error.message,
          });
    }
})
//create category
categoriesRoute.post("/" ,[categoryValidation.create], async (req, res) => {
    try {
        const { name } = req.body;
        
        const result = await pool.query(
            `INSERT INTO categories (name) VALUES ($1) RETURNING *`,
            [name]
        );
        return res.status(200).json({ data: result.rows})
    } catch (error) {
        return res.status(500).json({
            message: "Server could not read categories because database connection",
            error: error.message,
          });
    }
})
//update category
categoriesRoute.put("/" ,[categoryValidation.update], async (req, res) => {
    try {
        const { id } = req.body;
        const { name } = req.body;

        const result = await pool.query(
            `UPDATE categories SET name = $1 WHERE id = $2 RETURNING *`,
            [name, id]
        );
        return res.status(200).json({ data: result.rows})
    } catch (error) {
        return res.status(500).json({
            message: "Server could not read categories because database connection",
            error: error.message,
          });
    }
})
//delete category
categoriesRoute.delete("/" ,[categoryValidation.delete], async (req, res) => {
    try {
        const { id } = req.body;

        const result = await pool.query(
            `DELETE FROM categories WHERE id = $1 RETURNING *`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Category not found" });
        }
        return res.status(200).json({ message: "Deleted category successfully", data: result.rows[0]});
    } catch (error) {
        return res.status(500).json({
            message: "Server could not delete category because of database connection",
            error: error.message,
        });
    }
})


export default categoriesRoute
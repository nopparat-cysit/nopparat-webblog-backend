import "dotenv/config";

const categoryValidation = {
    create: (req, res, next) => {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: "Category name is required" });
        }
        next()
    },
    update: (req, res, next) => {
        const { id } = req.body;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Category name is required" });
        }
        if (!id) {
            return res.status(400).json({ message: "Category id is required for update" });
        }
        next()
    },
    delete: (req, res, next) => {
        const { id } = req.body;

        if (!id) {
            return res.status(400).json({ message: "Category id is required for deletion" });
        }
        next()
    }
}


export default categoryValidation;
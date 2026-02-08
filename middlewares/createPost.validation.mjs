import "dotenv/config";


const createPostValodation = async(req , res , next ) => {
    const newPost = {...req}

    if (!newPost.title) {
        return res.status(400).json({ message: "Server could not create post because there are missing data from client" })
    }

    if (!newPost.descrรption) {
        return res.status(400).json({ message: "Server could not create post because there are missing data from client" })
    }

    if (!newPost.content) {
        return res.status(400).json({ message: "Server could not create post because there are missing data from client" })
    }

    if (!newPost.image) {
        return res.status(400).json({ message: "Server could not create post because there are missing data from client" })
    }

    if (!newPost.category_id) {
        return res.status(400).json({ message: "Server could not create post because there are missing data from client" })
    }

    if (!newPost.status_id) {
        return res.status(400).json({ message: "Server could not create post because there are missing data from client" })
    }
    next()
}

export default createPostValodation
const validateCommunity = require("../middleware/validateCommunity");
const storeImage = require("../middleware/storeImage");
const deleteImage = require("../middleware/deleteImage");
const auth = require("../middleware/authorization");
const pool = require("../db/db");
const router = require("express").Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/ '});

/*
  /addPost
  Frontend: a post request, req.body = [username, text, photos(if any), communityName)]
  Backend
 */
router.post("/addPost", auth, upload.single('image'), storeImage, async (req, res, next) => {
  try {
    const {username, text, communityName, uploadResultsKey} = req.body;

    // Query for user
    const user = await pool.query(
      `SELECT user_id FROM users WHERE user_name = '${username}'`,
    );

    // Insert post into the corresponding community table
    const userId = user.rows[0].user_id;
    if (uploadResultsKey !== undefined) {
      await pool.query(`INSERT INTO ${communityName} (user_id, post_description, post_image_key) VALUES (${userId}, '${text}', '${uploadResultsKey}')`)
    } else {
      await pool.query(`INSERT INTO ${communityName} (user_id, post_description) VALUES (${userId}, '${text}')`)
    }

    res.send("Uploaded post succesfully");
  } catch (err) {
    console.log(err.message);
    res.status(500).json("Server Error at addPost in post.js.");
  }
});

/*
  /deletePost
  Frontend: a post request, req.body = [postId, communityName]
 */
router.delete("/deletePost", auth, deleteImage, async (req, res) => {
  try {
    const {postId, communityName} = req.body;

    // Query for post
    const post = await pool.query(`SELECT * FROM ${communityName} WHERE post_id = ${postId}`);
    const numberPosts = post.rowCount;

    // Check if the post exists
    if (numberPosts === 1) {
      await pool.query(`DELETE FROM ${communityName} WHERE post_id = ${postId}`);
    }

    res.send("Successfully deleted post");
  } catch (err) {
    console.log(err.message);
    res.status(500).json("Server Error at deletePost in post.js");
  }

});

/*
  /getPost
  Frontend: a post request, req.body = [communityName]
 */
router.get("/getPost", auth, validateCommunity, async (req, res) => {
  try {
    const {communityName} = req.body;
    const postQuery = await pool.query(`SELECT * FROM ${communityName} ORDER BY post_id DESC LIMIT 10`); 
    const posts = postQuery.rows
    res.json(posts);
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Server Error at getPost in post.js");
  }
});


module.exports = router;
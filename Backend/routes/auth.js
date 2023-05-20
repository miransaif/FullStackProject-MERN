const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const { signup, signout, signin } = require("../controllers/auth");

router.post(
  "/signup",
  [
    check("name")
      .isLength({ min: 3 })
      .withMessage("Must have atleast 3 Character!"),
    check("email").isEmail().withMessage("Enter a valid email"),
    check("password")
      .isLength({ min: 3 })
      .withMessage("Must have atleast 3 Character!"),
  ],
  signup
);

router.post(
  "/signin",
  [
    check("email").isEmail().withMessage("Enter a valid email"),
    check("password")
      .isLength({ min: 3 })
      .withMessage("Must have atleast 3 Character!"),
  ],
  signin
);

router.get("/signout", signout);

module.exports = router;

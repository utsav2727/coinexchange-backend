const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../model/UserModel");



router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({email:email});

  if (!user) return res.status(400).json({
    status:false,
    msg:'user not found'
  });

  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword)
    return res.status(400).json({
      status:false,
      msg:'invalid password'
    });

  const token = jwt.sign({ userId: user.id, userName: user.username }, process.env.JWT_SECRET);

  user.password = 'you can\'t see password';

  res.json({
   status: true,
   msg:'login success',
   user:user,
   token 
  })
});

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status:false,
        msg:'Email already exists'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      username,
      email,
      password: hashedPassword,
    });

    const savedUser = await user.save();

    const token = jwt.sign({ userId: savedUser.id, userName: savedUser.username }, process.env.JWT_SECRET)

    res.json({
      status:true,
      msg: "User registered successfully",
      userId: savedUser._id,
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      status:false,
      msg:'Internal server error'
    });
  }
});

router.post("/verifyToken", async (req, res)=>{
  try {
    const token = await req.headers.authorization.split(" ")[1];

    const decodedToken = await jwt.verify(token, process.env.JWT_SECRET);

    const user = await decodedToken;
    req.user = user;
    res.status(200).json({user})
  } catch (error) {
    // console.log('error', error);
    res.status(401).json({
      status:false,
      err:'Unauthorized access'
    })
  }
})

module.exports = router;
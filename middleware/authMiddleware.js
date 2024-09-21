const jwt = require("jsonwebtoken");

module.exports = async (request, response, next) => {
  try {
    // console.log('request.headers', request.headers);
    const token = await request.headers.authorization.split(" ")[1];

    const decodedToken = await jwt.verify(token, process.env.JWT_SECRET);

    const user = await decodedToken;
    request.user = user;
    console.log('user logged in', user);
    next();    
  } catch (error) {
    response.status(403).json({message:"Unauthorized"});
    return
    // response.redirect('http://localhost:3000/signin')
  }
};
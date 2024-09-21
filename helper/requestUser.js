const jwt = require("jsonwebtoken");

module.exports =  async (request) => {
    try {
      // console.log('request.headers', request.headers);
      const token = await request.headers.authorization.split(" ")[1];
  
      const decodedToken = await jwt.verify(token, process.env.JWT_SECRET);
  
      const user = await decodedToken;
      console.log('user logged in', user);
      return user
    } catch (error) {
      console.log('errror', error);
      return null
    }
  };
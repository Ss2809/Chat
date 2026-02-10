const jwt = require("jsonwebtoken");


const auth = async(req,res,next)=>{
  const token = req.headers.authorization;
  if(!token){
    return res.json({message : "Token not Provided!"});
  }
  const Token =token.split(" ")[1];
  let decoder;
  try {
    decoder = jwt.verify(Token, process.env.accessToken);
    req.user = decoder;
    next();
  } catch (error) {
    res.json({message:"Invalid token!!"})
  }
}

module.exports = auth;
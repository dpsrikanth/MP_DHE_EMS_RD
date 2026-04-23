const jwt_token=require("jsonwebtoken");
const verifyToken=(req,res,next)=>
{
    const authheader=req.headers["authorization"];
    if(!authheader)
    {
return res.status(401).json({message:"header missing"})
    }
    console.log(authheader,"authHraders")
    const token=authheader.split(" ")[1];
    if(!token)
    {
      return  res.status(403).json({message:"token is missing"});
    }
    jwt_token.verify(token,process.env.JWT_KEY,(err,user)=>
    {
        if(err)
        {
            return res.status(400).json({message:"token invalid"})
        }
        req.user=user
        next()
    })

}
const authorizeRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: "Access denied. Role information missing." });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied. Insufficient permissions." });
    }
    next();
  };
};

module.exports={verifyToken, authorizeRole}

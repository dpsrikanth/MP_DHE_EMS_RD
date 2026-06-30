const jwt_token=require("jsonwebtoken");
const verifyToken=(req,res,next)=>
{
    const authheader=req.headers["authorization"];
    // NOTE: never log req.headers here — the Authorization header carries the
    // bearer token and would leak it into the access logs.
    if(!authheader)
    {
return res.status(401).json({message:"Authorization header missing"})
    }
    const token=authheader.split(" ")[1];
    if(!token)
    {
      return  res.status(401).json({message:"Authentication token missing"});
    }
    jwt_token.verify(token,process.env.JWT_KEY,(err,user)=>
    {
        if(err)
        {
            // 401 (not 400) so the frontend's response interceptor can detect an
            // expired/invalid session and trigger auto-logout.
            const expired = err.name === 'TokenExpiredError';
            return res.status(401).json({message: expired ? "Session expired" : "Invalid authentication token"})
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

const jwt_token=require("jsonwebtoken");
const verifyToken=(req,res,next)=>
{
    const authheader=req.headers["Authorization"];
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
    jwt_token.verify(token,process.env.jwt_key,(err,user)=>
    {
        if(err)
        {
            return res.status(400).json({message:"token invalid"})
        }
        req.user=user
        next()
    })

}
module.exports={verifyToken}

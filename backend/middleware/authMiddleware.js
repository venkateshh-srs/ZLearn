import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  // console.log("got here");
  // console.log(req.cookies);
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1]; // 👈 Read from cookie
  console.log(token);
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { _id: decoded.id };
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

const jwt = require('jsonwebtoken');


const authorization = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer')) {
    return next(401,"Authentication failed")
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, 'jwtSecret');
    const { userId, name } = payload;
    req.user = { userId, name };
    next();
  } catch (err) {
    return next(403,"Authentication failed")
  }
};

module.exports = authorization;

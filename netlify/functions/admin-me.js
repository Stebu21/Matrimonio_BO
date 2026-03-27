const { verifyToken, json } = require('./_shared/auth');

exports.handler = async (event) => {
  if (verifyToken(event)) {
    return json({ logged: true });
  }
  return json({ logged: false }, 401);
};

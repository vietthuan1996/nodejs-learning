exports.getAllowedInfo = (body, allowedInfo) => {
  const allowed = {};
  Object.keys(body).forEach((key) => {
    if (allowedInfo.includes(key)) {
      allowed[key] = body[key];
    }
  });
  return allowed;
};

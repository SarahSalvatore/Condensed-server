const origins = require("./origins.js");

// if origin does not exist within allowedOrigins array, send error
const corsOptions = {
  origin: (origin, callback) => {
    if (origins.indexOf(origin) !== -1 || !origin) {
      // null for no error, true boolean for successful
      callback(null, true);
    } else {
      callback(new Error("Origin not allowed by CORS policy"));
    }
  },
  // access control allow credentials header
  credentials: true,
  optionsSuccessStatus: 200,
};

module.exports = corsOptions;

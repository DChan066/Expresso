// Accept and set an optional port argument for your server to listen on from process.env.PORT
// If process.env.PORT is not set, server should run on port 4000 (this is where the provided front-end will make requests to)
const express = require('express');
const app = express();
const PORT = process.env.PORT || 4000;

// Add middleware for parsing request bodies
const bodyParser = require('body-parser');
app.use(bodyParser.json());

// Add middleware for handling CORS requests
const cors = require('cors');
app.use(cors());

// Logging
const morgan = require('morgan');
app.use(morgan('dev'));

// Mount an existing router at the 'api' path
const apiRouter = require('./api/api');
app.use('/api', apiRouter);

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

module.exports = app;

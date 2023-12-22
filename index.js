const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

///////////
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    // ... other options ...
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['C:/Users/PC/Desktop/BENR 2423 Database and cloud system/assignment group O/Assignment Group O.js'], // Path to the API docs
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
console.log(swaggerDocs);
///////////


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://zhikangsam0724:2Un24f6Hfk4l1Z1x@cluster0.1jh2xph.mongodb.net/";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

client.connect().then(res => {
  console.log(res);
});

app.use(express.json());
//jia
app.use('/api-docs', (req, res, next) => {
  // Implement your authentication logic here.
  // For example, check for a specific token or user role.
  if (isAdmin(req.user)) {
      next();
  } else {
      res.status(403).send('Access Denied');
  }
}, swaggerUi.serve, swaggerUi.setup(swaggerDocs));
//



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});


app.get('/sam', (req, res) => {
  res.send('Name:O HaeWon')
})
app.get('/', (req, res) => {
  res.send('Name:HELLOW WORLD')
})

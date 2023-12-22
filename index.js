 const express = require('express');
 const app = express();
 const port = process.env.PORT || 3000;
 const swaggerUi = require('swagger-ui-express');
 const swaggerJsDoc = require('swagger-jsdoc');
 const { MongoClient, ServerApiVersion } = require('mongodb');
 const jwt = require('jsonwebtoken');
 
 // MongoDB URI and other sensitive info should be in environment variables
 const uri = "mongodb+srv://zhikangsam0724:2Un24f6Hfk4l1Z1x@cluster0.1jh2xph.mongodb.net/";
 
 const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      // ... other options ...
    },
    apis: ['C:/Users/PC/Desktop/BENR 3433 Information Security/assignment/BENR3433-S2G9/index.js'], // Path to the API docs
  };


 const swaggerDocs = swaggerJsDoc(swaggerOptions);
 app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
 
 // MongoDB Client Setup
 const client = new MongoClient(uri, {
   serverApi: {
     version: ServerApiVersion.v1,
     strict: true,
     deprecationErrors: true,
   }
 });
 
 client.connect()
   .then(() => console.log("Connected to MongoDB"))
   .catch(e => console.error("Failed to connect to MongoDB", e));
 
 app.use(express.json());
 
 // Define your routes and handlers here
 
 app.get('/', (req, res) => {
   res.send('Hello World!');
 });
 
 app.listen(port, () => {
   console.log(`App listening on port ${port}`);
 });
 
 // Define other functions like login, register, etc.
 
 // Ensure you have error handling for routes and database operations
 
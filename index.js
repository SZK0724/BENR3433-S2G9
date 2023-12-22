const express = require('express');
const app = express();
const port = process.env.PORT || 3002;

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


//改1
 app.post('/register/user', async (req, res) => {
  let result = register(
    req.body.username,
    req.body.password,
    req.body.name,
    req.body.email,
  );

  res.send(result);
});
///////////////

///////////////
//security login to the security account, if successfully login it will get a token for do other operation the security can do
 app.post('/login/security', (req, res) => {
  console.log(req.body);
  login(req.body.username, req.body.password)
    .then(result => {
      if (result.message === 'Correct password') {
        const token = generateToken({ username: req.body.username });
        res.send({ message: 'Successful login', token });
      } else {
        res.send('Login unsuccessful');
      }
    })
    .catch(error => {
      console.error(error);
      res.status(500).send("Internal Server Error");
    });
});
///////////////
///////////////
//the security view all the visitor (the token is true)
 app.get('/view/visitor/security', verifyToken, async (req, res) => {
  try {
    const result = await client
      .db('benr2423')
      .collection('visitor')
      .find()
      .toArray();

    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});
//////////////
/// security have kuasa to delete the user account after delete the user account all the visitor created by particular user also will delete
app.delete('/delete/user/:username', verifyToken, async (req, res) => {
  const username = req.params.username;

  try {
    // Delete the user
    const deleteUserResult = await client
      .db('benr2423')
      .collection('users')
      .deleteOne({ username });

    if (deleteUserResult.deletedCount === 0) {
      return res.status(404).send('User not found');
    }

    // Delete the user's documents
    const deleteDocumentsResult = await client
      .db('benr2423')
      .collection('documents')
      .deleteMany({ username });

    // Delete the visitors created by the user
    const deleteVisitorsResult = await client
      .db('benr2423')
      .collection('visitor')
      .deleteMany({ createdBy: username });

    res.send('User and associated data deleted successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

//user login account 
app.post('/login/user', (req, res) => {
  console.log(req.body);
  loginuser(req.body.username, req.body.password)
    .then(result => {
      if (result.message === 'Correct password') {
        const token = generateToken({ username: req.body.username });
        res.send({ message: 'Successful login', token });
      } else {
        res.send('Login unsuccessful');
      }
    })
    .catch(error => {
      console.error(error);
      res.status(500).send("Internal Server Error");
    });
});

///user create visitor 
app.post('/create/visitor/user', verifyToken, async (req, res) => {
  const createdBy = req.user.username; // Get the username from the decoded token
  let result = createvisitor(
    req.body.visitorname,
    req.body.checkintime,
    req.body.checkouttime,
    req.body.temperature,
    req.body.gender,
    req.body.ethnicity,
    req.body.age,
    req.body.phonenumber,
    createdBy
  );   
  res.send(result);
});

///view visitor that has been create by particular user 
app.get('/view/visitor/user', verifyToken, async (req, res) => {
  try {
    const username = req.user.username; // Get the username from the decoded token
    const result = await client
      .db('benr2423')
      .collection('visitor')
      .find({ createdBy: username }) // Retrieve visitors created by the authenticated user
      .toArray();

    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

/// user delete its visitor
app.delete('/delete/visitor/:visitorname', verifyToken, async (req, res) => {
  const visitorname = req.params.visitorname;
  const username = req.user.username; // Assuming the username is available in the req.user object

  try {
    // Find the visitor by visitorname and createdBy field to ensure the visitor belongs to the user
    const deleteVisitorResult = await client
      .db('benr2423')
      .collection('visitor')
      .deleteOne({ visitorname: visitorname, createdBy: username });

    if (deleteVisitorResult.deletedCount === 0) {
      return res.status(404).send('Visitor not found or unauthorized');
    }

    res.send('Visitor deleted successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});
/// user update its visitor info
app.put('/update/visitor/:visitorname', verifyToken, async (req, res) => {
  const visitorname = req.params.visitorname;
  const username = req.user.username;
  const { checkintime, checkouttime,temperature,gender,ethnicity,age,phonenumber } = req.body;

  try {
    const updateVisitorResult = await client
      .db('benr2423')
      .collection('visitor')
      .updateOne(
        { visitorname, createdBy: username },
        { $set: { checkintime, checkouttime,temperature,gender,ethnicity,age,phonenumber } }
      );

    if (updateVisitorResult.modifiedCount === 0) {
      return res.status(404).send('Visitor not found or unauthorized');
    }

    res.send('Visitor updated successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

/// visitor can view their data by insert their name
app.get('/view/visitor/:visitorName', async (req, res) => {
  const visitorName = req.params.visitorName;

  try {
    const result = await client
      .db('benr2423')
      .collection('visitor')
      .findOne({ visitorname: visitorName });

    if (result) {
      res.send(result);
    } else {
      res.status(404).send('Visitor not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

async function login(reqUsername, reqPassword) {
  let matchUser = await client.db('benr2423').collection('security').findOne({ username: { $eq: reqUsername } });

  if (!matchUser)
    return { message: "User not found!" };

  if (matchUser.password === reqPassword)
    return { message: "Correct password", user: matchUser };
  else
    return { message: "Invalid password" };
}

async function loginuser(reqUsername, reqPassword) {
  let matchUser = await client.db('benr2423').collection('users').findOne({ username: { $eq: reqUsername } });

  if (!matchUser)
    return { message: "User not found!" };

  if (matchUser.password === reqPassword)
    return { message: "Correct password", user: matchUser };
  else
    return { message: "Invalid password" };
}

function register(reqUsername, reqPassword, reqName, reqEmail) {
  client.db('benr2423').collection('users').insertOne({
    "username": reqUsername,
    "password": reqPassword,
    "name": reqName,
    "email": reqEmail,
  });
  return "account created";
}
///create visitor 
function createvisitor(reqVisitorname, reqCheckintime, reqCheckouttime,reqTemperature,reqGender,reqEthnicity,reqAge,ReqPhonenumber, createdBy) {
  client.db('benr2423').collection('visitor').insertOne({
    "visitorname": reqVisitorname,
    "checkintime": reqCheckintime,
    "checkouttime": reqCheckouttime,
    "temperature":reqTemperature,
    "gender":reqGender,
    "ethnicity":reqEthnicity,
    "age":reqAge,
    "phonenumber":ReqPhonenumber,
    "createdBy": createdBy // Add the createdBy field with the username
  });
  return "visitor created";
}

const jwt = require('jsonwebtoken');

function generateToken(userData) {
  const token = jwt.sign(
    userData,
    'mypassword',
    { expiresIn: 60 }
  );

  console.log(token);
  return token;
}

function verifyToken(req, res, next) {
  let header = req.headers.authorization;
  if (!header) {
    res.status(401).send('Unauthorized');
    return;
  }

  let token = header.split(' ')[1];

  jwt.verify(token, 'mypassword', function (err, decoded) {
    if (err) {
      res.status(401).send('Unauthorized');
      return;
    }
    req.user = decoded;
    next();
  });
}

//==========================
app.get('/sam', (req, res) => {
  res.send('Name:O HaeWon')
})
app.get('/', (req, res) => {
  res.send('Name:HELLOW WORLD')
})
//security login to the security account, if successfully login it will get a token for do other operation the security can do
/**
 * @swagger
 * tags:
 *   name: Security
 *   description: Security operations
 * 
 * components:
 *   schemas:
 *     Login:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: Security personnel's username.
 *         password:
 *           type: string
 *           description: Security personnel's password.
 * 
 * /login/security:
 *   post:
 *     tags: [Security]
 *     summary: Security login
 *     description: This endpoint allows security personnel to log in.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Login'
 *     responses:
 *       200:
 *         description: Successful login with token returned.
 *       401:
 *         description: Unauthorized access.
 */


/**
 * @swagger
 * /view/visitor/security:
 *   get:
 *     summary: View visitor data with security token
 *     description: Retrieve visitor data with a valid security token.
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved visitor data.
 *         content:
 *           application/json:
 *             example:
 *               - visitorData1
 *               - visitorData2
 *       401:
 *         description: Unauthorized. Invalid or missing security token.
 *       500:
 *         description: Internal Server Error. Failed to retrieve visitor data.
 */

/**
 * @swagger
 * /register/user:
 *   post:
 *     summary: Register a new user
 *     description: Allows a new user to create an account.
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - name
 *               - email
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account created successfully.
 *       400:
 *         description: Bad request.
 */


/**
 * @swagger
 * /delete/user/{username}:
 *   delete:
 *     summary: Delete a user account with security token
 *     description: Allows administrators to delete a user account.
 *     tags: [Security]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         description: Username of the user to be deleted.
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User deleted successfully.
 *       404:
 *         description: User not found.
 *       401:
 *         description: Unauthorized.
 */

/**
 * @swagger
 * tags:
 *   - name: User
 *     description: User operations
 * 
 * components:
 *   schemas:
 *     UserLogin:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: User's username.
 *         password:
 *           type: string
 *           description: User's password.
 * 
 * /login/user:
 *   post:
 *     summary: User login
 *     description: Log in as a user and receive an authentication token.
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *     responses:
 *       200:
 *         description: Successful login with token returned.
 *         content:
 *           application/json:
 *             example:
 *               message: Successful login
 *               token: generatedTokenString
 *       401:
 *         description: Login unsuccessful.
 *       500:
 *         description: Internal Server Error. Failed to process the login.
 */


/**
 * @swagger
 * tags:
 *   - name: User
 *     description: User operations
 * 
 * components:
 *   schemas:
 *     CreateVisitorRequest:
 *       type: object
 *       required:
 *         - visitorname
 *         - checkintime
 *         - checkouttime
 *         - temperature
 *         - gender
 *         - ethnicity
 *         - age
 *         - phonenumber
 *       properties:
 *         visitorname:
 *           type: string
 *           description: Visitor's name.
 *         checkintime:
 *           type: string
 *           description: Check-in time.
 *         checkouttime:
 *           type: string
 *           description: Check-out time.
 *         temperature:
 *           type: number
 *           description: Visitor's temperature.
 *         gender:
 *           type: string
 *           description: Visitor's gender.
 *         ethnicity:
 *           type: string
 *           description: Visitor's ethnicity.
 *         age:
 *           type: integer
 *           description: Visitor's age.
 *         phonenumber:
 *           type: string
 *           description: Visitor's phone number.
 * 
 * /create/visitor/user:
 *   post:
 *     summary: Create a visitor for the authenticated user
 *     description: Create a new visitor for the user with a valid token.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateVisitorRequest'
 *     responses:
 *       200:
 *         description: Visitor created successfully.
 *       401:
 *         description: Unauthorized. Invalid or missing security token.
 *       500:
 *         description: Internal Server Error. Failed to create the visitor.
 */


/**
 * @swagger
 * tags:
 *   - name: User
 *     description: User operations
 * 
 * /delete/visitor/{visitorname}:
 *   delete:
 *     summary: Delete a visitor for the authenticated user
 *     description: Delete a visitor for the user with a valid token.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: visitorname
 *         required: true
 *         description: Visitor's name to be deleted.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Visitor deleted successfully.
 *       401:
 *         description: Unauthorized. Invalid or missing security token.
 *       404:
 *         description: Visitor not found or unauthorized.
 *       500:
 *         description: Internal Server Error. Failed to delete the visitor.
 */

/**
 * @swagger
 * tags:
 *   - name: User
 *     description: User operations
 * 
 * /view/visitor/user:
 *   get:
 *     summary: View visitors created by the authenticated user
 *     description: Retrieve a list of visitors created by the user with a valid token.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved visitors.
 *         content:
 *           application/json:
 *             example:
 *               - visitorData1
 *               - visitorData2
 *       401:
 *         description: Unauthorized. Invalid or missing security token.
 *       500:
 *         description: Internal Server Error. Failed to retrieve visitors.
 */

/**
 * @swagger
 * tags:
 *   - name: User
 *     description: User operations
 * 
 * /update/visitor/{visitorname}:
 *   put:
 *     summary: Update visitor information for the authenticated user
 *     description: Update information for a visitor created by the user with a valid token.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: visitorname
 *         required: true
 *         description: Visitor's name to be updated.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               checkintime:
 *                 type: string
 *                 description: Updated check-in time.
 *               checkouttime:
 *                 type: string
 *                 description: Updated check-out time.
 *               temperature:
 *                 type: number
 *                 description: Updated visitor's temperature.
 *               gender:
 *                 type: string
 *                 description: Updated visitor's gender.
 *               ethnicity:
 *                 type: string
 *                 description: Updated visitor's ethnicity.
 *               age:
 *                 type: integer
 *                 description: Updated visitor's age.
 *               phonenumber:
 *                 type: string
 *                 description: Updated visitor's phone number.
 *     responses:
 *       200:
 *         description: Visitor updated successfully.
 *       401:
 *         description: Unauthorized. Invalid or missing security token.
 *       404:
 *         description: Visitor not found or unauthorized.
 *       500:
 *         description: Internal Server Error. Failed to update the visitor.
 */

/**
 * @swagger
 * tags:
 *   - name: Visitor
 *     description: Visitor operations
 * 
 * /view/visitor/{visitorName}:
 *   get:
 *     summary: View details of a specific visitor
 *     description: Retrieve details of a visitor by providing the visitor's name.
 *     tags: [Visitor]
 *     parameters:
 *       - in: path
 *         name: visitorName
 *         required: true
 *         description: Visitor's name to be retrieved.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved visitor details.
 *         content:
 *           application/json:
 *             example:
 *               visitorData1
 *       404:
 *         description: Visitor not found.
 *       500:
 *         description: Internal Server Error. Failed to retrieve visitor details.
 */

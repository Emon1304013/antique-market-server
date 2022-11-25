const express = require("express");
const cors = require("cors");

require("dotenv").config();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  console.log("Inside verifyjwt", authHeader);
  if (!authHeader) {
    return res.status(401).send("Unauthorised Access");
  }
  const token = authHeader.split(" ")[1];
  console.log("Token", token);
  jwt.verify(token, process.env.JWT_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
  // console.log(token);
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ph4ajav.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

//Database Connection
async function dbConnect() {
  try {
    client.connect();
  } catch (err) {
    console.log(err.name);
  }
}
dbConnect();

// creating Database collection
const usersCollection = client.db("antique-market").collection("users");
const productsCollection = client.db("antique-market").collection("products");
const categoriesCollection = client
  .db("antique-market")
  .collection("categories");


  // verfiy if the user is admin or not 

  const verifyAdmin = async(req,res,next) => {
    console.log('Inside Verify Admin',req.decoded.email);
    const decodeEmail = req.decoded.email;
  
    const query = {email: decodeEmail}
    const user = await usersCollection.findOne(query); //await use na koray mara khaicilam
    if(user?.role !== 'admin'){
      return res.status(403).send({message: "Forbidden access"})
    }
    next()
  }

// save user email and generate jwt
app.put("/user/:email", async (req, res) => {
  try {
    const email = req.params.email;
    console.log(email);
    const user = req.body;
    console.log(user);
    const filter = { email: email };
    const options = { upsert: true };
    const updateDoc = {
      $set: user,
    };
    const result = await usersCollection.updateOne(filter, updateDoc, options);
    newUser = {email:email}
    console.log(newUser);

    const token = jwt.sign(newUser, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.send({ result, token });
  } catch (err) {
    console.log(err);
  }
});

// get users admin role 
app.get('/users/admin/:email',async(req,res)=>{
  const email = req.params.email;
  console.log(email);
  const query = {email}
  const user = await usersCollection.findOne(query);
  res.send({isAdmin: user?.role === 'admin'})

})
// get Seller role 
app.get('/users/seller/:email',async(req,res)=>{
  const email = req.params.email;
  console.log(email);
  const query = {email}
  const user = await usersCollection.findOne(query);
  res.send({isSeller: user?.userType === 'Seller'})

})

// get categories from database

app.get("/categories", async (req, res) => {
  const query = {};
  const result = await categoriesCollection.find(query).toArray();
  res.send(result);
});

// get single category data
app.get("/categories/:id", async (req, res) => {
  const id = req.params.id;
  console.log(id);
  const query = { categoryId: id };
  const result = await productsCollection.find(query).toArray();
  res.send(result);
});

//store categories in the database
app.put('/categories',async(req,res)=>{
  const category = req.body;
  const filter = {categoryName: req.body.categoryName}
  const options = { upsert: true}
  const updateDoc = {
    $set: category,
  }
  const result = await categoriesCollection.updateOne(filter,updateDoc,options);
  res.send({success:true,result});
})



// get products from database 
app.get("/products",verifyJWT, async (req, res) => {
  const query = {};
  const result = await productsCollection.find(query).toArray();
  res.send(result);
});
// Get Products from specific seller 
app.get("/products/seller/:email",verifyJWT,async(req,res)=>{
  const email = req.params.email;
  const query = {sellerEmail:email};
  const result = await productsCollection.find(query).toArray();
  res.send(result);
})
//add product to database
app.post("/products",verifyJWT, async (req, res) => {
  try {
    const decodedEmail = req.decoded.email;
    if(decodedEmail !== req.decoded.email){
      return res.status(401).send("Unauthorized access")
    }
    const product = req.body;
    const result = await productsCollection.insertOne(product);
    res.send(result);
  } catch (err) {
    res.send(err);
  }
});

app.get("/", (req, res) => {
  res.send(`Welcome to Antique Market Server`);
});

app.listen(port, () => {
  console.log(`Antique Market Server server runing on port ${port}`);
});

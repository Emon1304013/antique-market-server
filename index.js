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
  if (!authHeader) {
    return res.status(401).send("Unauthorised Access");
  }
  const token = authHeader.split(" ")[1];
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
const bookingsCollection = client
  .db("antique-market")
  .collection("bookings");


  // verfiy if the user is admin or not 

  const verifyAdmin = async(req,res,next) => {
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

// get user data by email 

app.get('/user/:email',verifyJWT,async(req,res)=>{
  const query = { email: req.params.email};
  const result = await usersCollection.findOne(query);
  res.send(result);

})
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

// get sellers from database 

app.get('/users/sellers',verifyJWT,async(req,res)=>{
  const query = {userType:'Seller'}
  const result = await usersCollection.find(query).toArray();
  res.send(result);
})

// get buyers from database 

app.get('/users/buyers',verifyJWT,async(req,res)=>{
  const query = {userType:'Buyer'}
  const result = await usersCollection.find(query).toArray();
  res.send(result);
})

// update seller verify status 
app.patch('/seller/verify/:email',async(req,res)=>{
  const email = req.params.email;
  const query = {email:email}
  const options = {upsert:true}
  const updateDoc = {
    $set: {"isVerified":true}
  }
  const result = await usersCollection.updateOne(query,updateDoc,options);
  res.send({isVerified:true});
})

// Delete seller from Database  

app.delete('/users/seller/:id',verifyJWT,async(req,res)=>{
  const id = req.params.id;
  const query = {_id: ObjectId(id)}
  const result = await usersCollection.deleteOne(query);
  res.send(result);
})

// Delete Buyer from database 
app.delete('/users/buyer/:id',verifyJWT,async(req,res)=>{
  const id = req.params.id;
  const query = {_id: ObjectId(id)}
  const result = await usersCollection.deleteOne(query);
  res.send(result);
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

//store categories in the database, used PUT method to avoid duplicates
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
//API to set advertised to true. 
app.patch('/products/advertise/:id',async(req,res)=>{
  const id = req.params.id;
  const filter = {_id: ObjectId(id)}
  const options = {upsert: true}
  const updateDoc = {
    $set:{isAdvertised:true}
  }
  const result = await productsCollection.updateOne(filter,updateDoc,options);
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

// add booking data to database 

app.post('/bookings',async(req,res)=>{
  const booking = req.body;
  console.log(booking);
  const result = await bookingsCollection.insertOne(booking)
  res.send(result);
})

app.get('/bookings/:email',async(req,res)=>{
  const email = req.params.email;
  const query = {userEmail: email}
  const result = await bookingsCollection.find(query).toArray();
  res.send(result);
})

app.get("/", (req, res) => {
  res.send(`Welcome to Antique Market Server`);
});

app.listen(port, () => {
  console.log(`Antique Market Server server runing on port ${port}`);
});

const express = require("express");
const cors = require("cors");

require("dotenv").config();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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
const categoriesCollection = client.db("antique-market").collection("categories");

// save user email and generate jwt
app.put("/user/:email", async (req, res) => {
  try {
    const email = req.params.email;
    console.log(email);
    const user = req.body;
    const filter = { email: email };
    const options = { upsert: true };
    const updateDoc = {
      $set: user,
    };
    const result = await usersCollection.updateOne(filter, updateDoc, options);
    console.log(result);

    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.send({ result, token });
  } catch (err) {
    console.log(err);
  }
});

// add categories to the database 

app.post('/categories',async(req,res)=>{
  try{  
    const category = req.body;
    const result = await categoriesCollection.insertOne(category)
    res.send(result)
  }
  catch(err) {
    console.log(err);
  }
})

//add product to database
app.post("/products", async(req,res) => {
  try {
    const product = req.body;
    console.log(product);
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

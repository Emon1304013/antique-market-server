const express = require("express");
const cors = require("cors");

require("dotenv").config();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ph4ajav.mongodb.net/?retryWrites=true&w=majority`;



const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

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
const usersCollection = client.db('antique-market').collection('users');




// app.put('/users',async(req,res)=>{
//     const user = req.body;
//     const filter = {email: req.body.email}
//     const options = {upsert: true}
//     const updateDoc = {
//         $set: {
                
//         }
//     }
//     const result = await 

// })

app.get("/", (req, res) => {
  res.send(`Welcome to Antique Market Server`);
});

app.listen(port, () => {
  console.log(`Antique Market Server server runing on port ${port}`);
});

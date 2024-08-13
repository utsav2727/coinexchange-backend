require('dotenv').config()
const bodyParser = require('body-parser');
const express = require('express');
const authRoutes = require('./routes/authRoutes');



const app = express();


app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
    );
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, PATCH, OPTIONS"
    );
    next();
  });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


//routes 
app.use('/api/auth', authRoutes);


//listen
app.listen(process.env.PORT, ()=>{
    console.log('server started on port', process.env.PORT);
})
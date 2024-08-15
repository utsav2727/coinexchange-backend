require('dotenv').config()
const bodyParser = require('body-parser');
const express = require('express');
const authRoutes = require('./routes/authRoutes');
const dbConnect = require('./config/connection');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();


dbConnect();


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
app.get('/',(req, res)=>{
  res.send('OK')
}); 
app.use('/api/auth', authRoutes);

app.get('/protected', authMiddleware, (req, res)=>{
  res.send('OK');
})


//listen
app.listen(process.env.PORT, ()=>{
    console.log('server started on port', process.env.PORT);
})
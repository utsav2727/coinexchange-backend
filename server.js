require('dotenv').config()
const bodyParser = require('body-parser');
const express = require('express');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const dbConnect = require('./config/connection');
const authMiddleware = require('./middleware/authMiddleware');
const cors = require('cors');

const app = express();


dbConnect();

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


//routes
app.get('/api/test',(req, res)=>{
  res.send('OK')
}); 
app.use('/api/auth', authRoutes);

app.use('/api/',userRoutes);


app.get('/protected', authMiddleware, (req, res)=>{
  res.send('OK');
})


//listen
app.listen(process.env.PORT, ()=>{
    console.log('server started on port', process.env.PORT);
})
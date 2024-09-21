require('dotenv').config()
const bodyParser = require('body-parser');
const express = require('express');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const currencyRoutes = require('./routes/currencyRoutes');
const depositRoutes = require('./routes/depositRoutes');
const withdrawRoutes = require('./routes/withdrawRoutes');
const walletRoutes = require('./routes/walletRoutes');
const tradeRoutes = require('./routes/tradeRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const configRoutes = require('./routes/configRoutes');
const supportRoutes = require('./routes/supportRoutes');
const {router:chatRoutes} = require('./routes/chatRoutes');
const kycRoutes = require('./routes/kycRoutes');
const dbConnect = require('./config/connection');
const authMiddleware = require('./middleware/authMiddleware');
const cors = require('cors');
const webPush = require('web-push');
var admin = require("firebase-admin");

const app = express();

// const publicVapidKey = 'BFAADld1xChQ3kyQmiwrMHuB9jhWJHLJht8pz4UXCL2ql2mdK1AXvc97YtAnFfl4nJjIKcLqgF6XJk_Z_XPhftU';
// const privateVapidKey = 'gwVTY9DXGnRglSrRPY8bHJrez-fLD2_bwwTeyDWx9_E';

// webPush.setVapidDetails('mailto:test@utsavpatel.com', publicVapidKey, privateVapidKey);


dbConnect();

app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/uploads', express.static('uploads'));


var serviceAccount = require("./key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
//routes



app.post('/send-notification', async (req, res) => {
  const { token, title, body } = req.body; // Expect token and message in the request body

  const message = {
    notification: {
      title: title,
      body: body,
    },
    token: token,
  };

  try {
    const response = await admin.messaging().send(message);
    res.status(200).json({ success: true, message: 'Notification sent!', response });
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({ success: false, message: 'Failed to send notification', error });
  }
});

app.get('/api/test',(req, res)=>{
  res.send('OK')
}); 
app.use('/api/auth', authRoutes);
app.use('/api/',userRoutes);
app.use('/api/currency',currencyRoutes);
app.use('/api/deposits',authMiddleware,depositRoutes);
app.use('/api/withdraw',authMiddleware,withdrawRoutes);
app.use('/api/wallet',authMiddleware,walletRoutes);
app.use('/api/trades',tradeRoutes);
app.use('/api/chat',chatRoutes);
app.use('/api/transaction',transactionRoutes);
app.use('/api/config',configRoutes);
app.use('/api/kyc',kycRoutes);
app.use('/api/support',supportRoutes);




app.get('/protected', authMiddleware, (req, res)=>{
  res.send('OK');
})


//listen
app.listen(process.env.PORT, ()=>{
    console.log('server started on port', process.env.PORT);
});


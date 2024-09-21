const express = require('express');
const router = express.Router();
const Trade = require('../model/Trade'); // Adjust the path as needed
const StatusRef = require('../model/StatusRef');
const Users = require('../model/UserModel');
const Wallet = require('../model/Wallet');
const TradeLineItems = require('../model/TradeLineItems');
const { createChat } = require('./chatRoutes');
const authMiddleware = require('../middleware/authMiddleware');
const Chat = require('../model/Chat');
const requestUser = require('../helper/requestUser');
let admin = require("firebase-admin");
const UserModel = require('../model/UserModel');
const Transaction = require('../model/Transactions');
const Config = require('../model/Configuration');

// const {admin} = require('../server');

// CREATE a new trade
router.post('/', authMiddleware,async (req, res) => {
  try {
    let type = req.body.type;
    let sourceAmount = parseFloat(req.body.sourceAmount);
    //validation

    // Fetch config limits
    const config = await Config.findOne(); // Fetch the first configuration document

    if (!config) {
      return res.status(500).json({ message: "Configuration not found" });
    }

    // Validation based on buy or sell type
    if (type === 'buy' && sourceAmount > config.buylimit) {
      return res.status(400).json({ message: `Buy limit exceeded. Maximum allowed is ${config.buylimit}` });
    }

    if (type === 'sell' && sourceAmount > config.sellLimit) {
      return res.status(400).json({ message: `Sell limit exceeded. Maximum allowed is ${config.sellLimit}` });
    }

    let userBalance = await Wallet.findOne({userId:req.user.userId});

    if(type=="sell"){
      if(!userBalance){
        res.status(500).json({message:"Please deposit amount for Sell Trade."});
        return
      }
  
      if(userBalance){
        console.log('userbalance', userBalance);
        if(userBalance.amount<sourceAmount){
          res.status(500).json({message:"Please deposit amount for trade."})
          return
        }
      }
    }


    let statusRef = await StatusRef.findOne({type:'trade', name:'posted'});
    console.log('statusRef', statusRef);
    let statusRefId = statusRef._id;

    let charges = 0;
    let exchangeRate = parseFloat(req.body.exchangeRate);

    let buyer=undefined;
    let seller=undefined;
    let paymentWindow = 30;
    if(type == 'buy'){
        buyer = req.user.userId;
    }else if(type =='sell') {
        seller = req.user.userId;
    }else{
        res.json(500).json({message:'Wrond Trade Request'})
        return
    }

    

    const trade = new Trade({
        type:type,
        status:statusRefId,
        seller:seller,
        buyer:buyer,
        charges:charges,
        sourceAmount:sourceAmount,
        exchangeRate:exchangeRate,
        paymentWindow:paymentWindow,
        prefferedpaymentType:req.body.prefferedpaymentType
    });
    const tradeResponse = await trade.save();
    req.tradeId = tradeResponse._id

    const chat = await createChat(req);

    if(!chat.status){
        console.log
        res.status(500).json({message:"error in creating chat"})
        return
    }
    let chatId = chat.response._id

    console.log('chatId', chatId);
    res.status(201).json(trade);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// READ all trades
router.post('/list', async (req, res) => {
  try {

    const isUser = await requestUser(req);
    if(!isUser){
      const trades = await Trade.find({type:req.body.type}).populate('buyer seller status chatId');
      res.json(trades);
      return
    }

    console.log("isUser", isUser);
    if(req.body.type=="buy"){
      console.log('buy');
      const trades = await Trade.find({
        type: req.body.type,
        buyer: { $ne: isUser.userId }}).populate('buyer seller status chatId');
      res.json(trades);
      return
    }

    if(req.body.type=="sell"){
      console.log('sell')
      const trades = await Trade.find({
        type: req.body.type,
        seller: { $ne: isUser.userId }}).populate('buyer seller status chatId');
      res.json(trades);
      return
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const trades = await Trade.find()
      .populate({
        path: 'buyer',
        select: 'username email'
      })
      .populate({
        path: 'seller',
        select: 'username email'
      })
      .populate('status chatId')
      .sort({ createdAt: -1 }); // Sort by 'createdAt' in descending order (-1 for latest first)
    
    res.json(trades);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/tradeitems/:id', async (req, res)=>{
  try {
    const id = req.params.id;
  const tradeLineItems = await TradeLineItems.findById(id);
  res.status(200).json(tradeLineItems);
  } catch (error) {
    console.log(error);
    res.status(500).json({message:"internal server error"});
  }
});

router.get('/mybuytrades', authMiddleware ,async (req, res) => {
  try {
    console.log('req user', req.user.userId);
    const userId = req.user.userId; 

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: User not authenticated' });
    }


    // Find trade line items where the user is the buyer
    const tradeLineItems = await TradeLineItems.find({ buyer: userId })
      .populate('seller', 'username') // Populate seller details
      .populate('tradeId', 'sourceAmount exchangeRate') // Populate trade details
      .sort({ createdAt: -1 }); // Sort by creation date, newest first


    res.json(tradeLineItems);
  } catch (error) {
    console.error('Error fetching trade line items:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/myselltrades', authMiddleware ,async (req, res) => {
  try {
    console.log('req user', req.user.userId);
    const userId = req.user.userId; 

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: User not authenticated' });
    }


    // Find trade line items where the user is the buyer
    const tradeLineItems = await TradeLineItems.find({ seller: userId })
      .populate('buyer', 'username') // Populate seller details
      .populate('tradeId', 'sourceAmount exchangeRate') // Populate trade details
      .sort({ createdAt: -1 }); // Sort by creation date, newest first

    res.json(tradeLineItems);
  } catch (error) {
    console.error('Error fetching trade line items:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/mypostedTrade', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId; // Get the user ID from the authenticated user

    // Fetch trades where the user is either the buyer or the seller
    const trades = await Trade.find({
      $or: [
        { buyer: userId }, // User is the buyer
        { seller: userId }, // User is the seller
      ]
    })
    .populate('buyer', 'username email') // Populate buyer info (you can add other fields)
    .populate('seller', 'username email') // Populate seller info (you can add other fields)
    .populate('status') // Populate status information
    .sort({ createdAt: -1 }); // Sort by newest trades first

    // Return the fetched trades
    res.status(200).json(trades);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch trades" });
  }
});

// READ a specific trade by ID
router.get('/:id', async (req, res) => {
  try {
    let trade = await Trade.findById(req.params.id).populate('buyer seller status');
    const chats = await Chat.find({tradeId:req.params.id});
    console.log('chats ', chats);
    if (!trade) return res.status(404).json({ message: 'Trade not found' });

    let modified = trade.toObject();
    modified.chats = chats;

    res.json(modified);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


//create tradeLineItem
router.post('/createTradeItem', authMiddleware,async (req, res) => {
  try {

    const { type, seller, tradeId, message } = req.body;

    let buyer;
    if(type == 'buy'){
      buyer = req.user.userId;
    }

    console.log('trade id', tradeId)

    // Validate required fields
    if (!buyer || !seller || !tradeId) {
      return res.status(400).json({ message: 'Buyer, seller, and tradeId are required fields' });
    }

    let isExists = await TradeLineItems.findOne({tradeId:tradeId, buyer, seller});

    console.log('isExists', isExists);

    if(isExists !== null){
      res.status(500).json({message:"Already exists Trade Item. please check Trade Menu"});
      return;
    }

    // Create a new trade line item
    const newTradeLineItem = new TradeLineItems({
      buyer,
      seller,
      tradeId
    });

    // Save the new trade line item
    const savedTradeLineItem = await newTradeLineItem.save();

    console.log('savedTradeLineItem', savedTradeLineItem.toObject());



    // assuming tradeitem for buy
    const createChat = await Chat.create({
      from:buyer,
      to:seller,
      message:message,
      tradeLineItem:savedTradeLineItem._id
    });

    console.log('createdChat', createChat);

    res.status(201).json(savedTradeLineItem);
  } catch (error) {
    console.error('Error creating trade line item:', error);
    res.status(500).json({ message: 'Error creating trade line item', error: error.message });
  }
});

router.post('/createTradeItemSell', authMiddleware,async (req, res) => {
  try {

    const { type, buyer, tradeId, message } = req.body;

    let seller;
    if(type == 'sell'){
      seller = req.user.userId;
    }

    console.log('trade id', tradeId)

    // Validate required fields
    if (!buyer || !seller || !tradeId) {
      return res.status(400).json({ message: 'Buyer, seller, and tradeId are required fields' });
    }

    let isExists = await TradeLineItems.findOne({tradeId:tradeId, buyer, seller});

    console.log('isExists', isExists);

    if(isExists !== null){
      res.status(500).json({message:"Already exists Trade Item. please check Trade Menu"});
      return;
    }

    // Create a new trade line item
    const newTradeLineItem = new TradeLineItems({
      buyer,
      seller,
      tradeId
    });

    // Save the new trade line item
    const savedTradeLineItem = await newTradeLineItem.save();

    console.log('savedTradeLineItem', savedTradeLineItem.toObject());



    // assuming tradeitem for buy
    const createChat = await Chat.create({
      from:seller,
      to:buyer,
      message:message,
      tradeLineItem:savedTradeLineItem._id
    });

    console.log('createdChat', createChat);

    res.status(201).json(savedTradeLineItem);
  } catch (error) {
    console.error('Error creating trade line item:', error);
    res.status(500).json({ message: 'Error creating trade line item', error: error.message });
  }
});

router.put('/cancelTradeLineItem/:id', authMiddleware, async (req, res) => {
  try {
    // Find the TradeLineItem by ID
    const tradeLineItem = await TradeLineItems.findById(req.params.id);

    // Check if the trade line item exists
    if (!tradeLineItem) {
      return res.status(404).json({ message: 'TradeLineItem not found' });
    }

    // Update the status to 'Cancelled'
    tradeLineItem.status = 'Cancelled';
    
    // Save the updated trade line item
    await tradeLineItem.save();

    // Respond with the updated trade line item
    res.status(200).json({ message: 'TradeLineItem status updated to Cancelled', tradeLineItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
});


router.post('/paidbuttonTradeLineItem/:id', authMiddleware, async (req, res) => {
  try {
    // Find the TradeLineItem by ID
    const userId = req.user.userId;
    const tradeLineItem = await TradeLineItems.findById(req.params.id);

    // Check if the trade line item exists
    if (!tradeLineItem) {
      return res.status(404).json({ message: 'TradeLineItem not found' });
    }

    // Update the status to 'Cancelled'
    tradeLineItem.status = 'Buyer Paid';


    const chat = new Chat({
      from: tradeLineItem.buyer,
      to: tradeLineItem.seller,
      message: "Note: Buyer Marked as Paid to Seller.",
      attachment: null, 
      tradeLineItem: tradeLineItem
    });

    await chat.save();

    // const user = Users.findById({_id:tradeLineItem.seller});
    const user = await UserModel.findById({_id:tradeLineItem.seller});
    
    console.log('user', user);
    console.log(user.notificationToken);

    if(user.notificationToken){

      const message = {
        notification: {
          title: "Buyer marked as Paid",
          body: "Please check current status of the trade",
        },
        token: user.notificationToken,
      };
      try {
        const response = await admin.messaging().send(message);
        console.log('notification ', response);
      } catch (error) {
        console.log('errror', error);
      }
    }

    console.log('tradeLineItem', tradeLineItem);
    
    // Save the updated trade line item
    await tradeLineItem.save();

    // Respond with the updated trade line item
    res.status(200).json({ message: 'TradeLineItem status updated to buyer posted', tradeLineItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
});

router.post('/recievebuttonTradeLineItem/:id', authMiddleware, async (req, res) => {
  try {
    // Find the TradeLineItem by ID
    const userId = req.user.userId;
    const tradeLineItem = await TradeLineItems.findById(req.params.id);

    const tradeData = await Trade.findOne({_id:tradeLineItem.tradeId});
    
    const tradeAmt = tradeData.sourceAmount;

    // Check if the trade line item exists
    if (!tradeLineItem) {
      return res.status(404).json({ message: 'TradeLineItem not found' });
    }

    if(tradeLineItem.status !== "Buyer Paid"){
      return res.status(500).json({message:"Buyer has not marked as paid."})
    }

    // Find wallets for the seller and buyer
    const sellerWallet = await Wallet.findOne({ userId: tradeLineItem.seller});
    const buyerWallet = await Wallet.findOne({ userId: tradeLineItem.buyer });

    if (!sellerWallet) {
      return res.status(500).json({ message: 'Seller or Buyer wallet not found' });
    }
    // Ensure seller has enough amount in wallet
    if (sellerWallet.amount < tradeAmt) {
      return res.status(400).json({ message: 'Seller does not have enough funds' });
    }

    if(!buyerWallet){
      
      let walletResponse = await Wallet.create({
        amount:tradeAmt,
        userId:tradeLineItem.buyer,
        currencyId:sellerWallet.currencyId
      });

      await Transaction.create({
        userId: tradeLineItem.buyer, 
        type: "credit",
        amount: tradeAmt
      });
      
      console.log('walletresponse', walletresponse);

    }else{
      sellerWallet.amount -= tradeAmt;
      buyerWallet.amount += tradeAmt;
      await buyerWallet.save();

      await Transaction.create({
        userId: tradeLineItem.buyer, 
        type: "credit",
        amount: tradeAmt
      });
    }

    await Transaction.create({
      userId: tradeLineItem.seller, 
      type: "debit",
      amount: tradeAmt
    });
    // Save updated wallets
    await sellerWallet.save();

    // Update the status to 'Cancelled'
    tradeLineItem.status = 'Closed';

    const chat = new Chat({
      from: tradeLineItem.seller,
      to: tradeLineItem.buyer,
      message: "Note: Seller Release payment to buyer.",
      attachment: null, 
      tradeLineItem: tradeLineItem
    });

    await chat.save();

    console.log('tradeLineItem', tradeLineItem);
    
    // Save the updated trade line item
    await tradeLineItem.save();

    const user = await UserModel.findById({_id:tradeLineItem.buyer});
    
    console.log('user', user);
    console.log(user.notificationToken);

    if(user.notificationToken){

      const message = {
        notification: {
          title: "Sellet released the payment.",
          body: "Kindly check the wallet for payment receive.",
        },
        token: user.notificationToken,
      };
      try {
        const response = await admin.messaging().send(message);
        
        console.log('notification ', response);
      } catch (error) {
        console.log('error', error);
      }


    }

    // Respond with the updated trade line item
    res.status(200).json({ message: 'TradeLineItem status updated to released.', tradeLineItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
});

// UPDATE a trade by ID
router.put('/:id', async (req, res) => {
  try {
    const trade = await Trade.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!trade) return res.status(404).json({ message: 'Trade not found' });
    res.json(trade);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//chat between seller and buyer
router.get('/chats/:id', authMiddleware, async (req, res) => {
  try{
  console.log('req user', req.user.userId);
  console.log('trade Id', req.params.id);
  const userId = req.user.userId;

  // i am in buyer or seller

  const AmIBuyer = await Chat.find({type:"buyer" ,from:req.user.userId, tradeId: req.params.id});
  const AmISeller = await Chat.find({type:"seller" ,from:req.user.userId, tradeId: req.params.id});

  console.log('AmIBuyer', AmIBuyer);
  console.log('AmIseller', AmISeller);

  if(AmIBuyer.length ==0 && AmIBuyer ==0 ){
    res.status(400).json({ message: "you are not authorized to view." });
    return
  }
  let currentUser;
  let chats;

  if(AmIBuyer.length !==0){
    currentUser == 'buyer';
    chats = await Chat.find({
      tradeId: req.params.id,
      $or: [
        { from: userId },
        { to: userId }
      ]
    }).sort({ createdAt : -1 });
  };

  if(AmISeller.length !==0){
    currentUser == 'seller';
    chats = await Chat.find({
      tradeId: req.params.id,
      $or: [
        { from: userId },
        { to: userId }
      ]
    }).sort({ createdAt : -1 });
  } 


    // const trade = await Trade.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    // if (!trade) return res.status(404).json({ message: 'Trade not found' });
    res.json(chats);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});



// DELETE a trade by ID
router.delete('/:id', async (req, res) => {
  try {
    const trade = await Trade.findByIdAndDelete(req.params.id);
    if (!trade) return res.status(404).json({ message: 'Trade not found' });
    res.json({ message: 'Trade deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Trade = require('../model/Trade'); // Adjust the path as needed
const StatusRef = require('../model/StatusRef');
const TradeLineItems = require('../model/TradeLineItems');
const { createChat } = require('./chatRoutes');
const authMiddleware = require('../middleware/authMiddleware');
const Chat = require('../model/Chat');

// CREATE a new trade
router.post('/', authMiddleware,async (req, res) => {
  try {
    let type = req.body.type;

    let statusRef = await StatusRef.findOne({type:'trade', name:'posted'});
    console.log('statusRef', statusRef);
    let statusRefId = statusRef._id;

    let charges = 0;
    let sourceAmount = parseFloat(req.body.sourceAmount);
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
        paymentWindow:paymentWindow
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
    const trades = await Trade.find({type:req.body.type}).populate('buyer seller status chatId');
    res.json(trades);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const trades = await Trade.find().populate('buyer seller status chatId');
    res.json(trades);
  } catch (error) {
    res.status(500).json({ message: error.message });
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

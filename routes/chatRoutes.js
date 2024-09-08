
const express = require('express');
const Chat = require('../model/Chat');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();



router.post('/',authMiddleware ,async (req, res)=>{
    const response = await createChat(req);
    if(response.status){
        res.status(201).json(response)
        return
    }else{
        res.status(500).json(response)
    }
});


const createChat = async (req)=>{
try {
    let type;
    if(req.body.type=='buy'){
        type='buyer';
    }else if(req.body.type=='sell'){
        type='seller';
    }else{
        return {
            status:false , message:'Error while creating chat'
        }
    }
    let response = await Chat.create({
        from:req.user.userId,
        to:undefined,
        message:req.body.message,
        type:type,
        tradeId:req.tradeId
    })
    return {status:true, response}
} catch (error) {
    console.log('error', error);
    return {status:false , message:'Error while creating chat'}    
}
}


router.get('/fetch/:tradeId/:tradeItemId',authMiddleware ,async (req, res) => {
    try {
      const { tradeId, tradeItemId } = req.params;
      const userId = req.user.userId; // Assuming you have user authentication middleware
      
      // Fetch the first chat record for the trade
      const tradeChat = await Chat.findOne({ tradeId })
        .sort({ createdAt: 1 })
        .populate('from to', 'name username') // Adjust fields as needed
        .lean();
  
      if (!tradeChat) {
        return res.status(404).json({ message: 'No chat found for this trade' });
      }
  
      // Fetch chat records for trade line items
      const lineItemChats = await Chat.find({
        tradeLineItem: tradeItemId
      })
        .sort({ createdAt: 1 })
        .populate('from to tradeLineItem', 'name username') // Adjust fields as needed
        .lean();
  
      // Combine results
      const result = {
        tradeChat,
        lineItemChats
      };
  
      res.json(result);
    } catch (error) {
      console.error('Error fetching chat items:', error);
      res.status(500).json({ message: 'Error fetching chat items', error: error.message });
    }
  });


router.post('/createChat', authMiddleware ,async (req, res)=>{
  
  try {
    const userId = req.user.userId;
    const to = req.body.to;
    const response = await Chat.create({
      from:userId,
      to:to,
      message:req.body.message,
      tradeLineItem: req.body.tradeLineItem
    });
    res.status(201).json(response)
  } catch (error) {
    res.status(500).json(response)
  }
});



module.exports = {router, createChat}

const express = require('express');
const Chat = require('../model/Chat');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();
let admin = require("firebase-admin");
const UserModel = require('../model/UserModel');

const { upload } = require('../config/multerConfig');

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


router.post('/createChat', authMiddleware, upload.single('image'), async (req, res) => {
    try {
      console.log('here');
      const userId = req.user.userId;
      const to = req.body.to;
      const message = req.body.message;
      const tradeLineItem = req.body.tradeLineItem;
  
      // Check if an image file is uploaded
      let attachment = null;
      if (req.file) {
        attachment = req.file.path;  // Store the uploaded image path
      }
  
      const chat = new Chat({
        from: userId,
        to: to,
        message: message,
        attachment: attachment,  // Store the image URL/path if uploaded
        tradeLineItem: tradeLineItem
      });
  
      await chat.save();

    const user = await UserModel.findById({_id:to});
    
    console.log('user', user);
    console.log(user.notificationToken);

    if(user.notificationToken){

      const message = {
        notification: {
          title: "You have a message.",
          body: "Kindly check ongoing trade message.",
        },
        token: user.notificationToken,
      };

      const response = await admin.messaging().send(message);

      console.log('notification ', response);
    }

      res.status(201).json(chat);  // Send the saved chat message as response
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Error creating chat message', error });
    }
  });



module.exports = {router, createChat}
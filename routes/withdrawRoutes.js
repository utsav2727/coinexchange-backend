// routes/currencyRoutes.js
const express = require('express');
const router = express.Router();
const WithdrawTransaction = require('../model/WithdrawTransaction');
const StatusRef = require('../model/StatusRef');
const Currency = require('../model/Currency');
const Wallet = require('../model/Wallet');

router.get('/', async (req, res) => {
  try {
    const withdrawals = await WithdrawTransaction.find().populate('status').populate('currencyId').populate('userId');
    res.json(withdrawals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/withdrawByUser', async (req, res) => {
    try {
        let currentUser = req.user.userId;
        const withdrawals = await WithdrawTransaction.find({userId:currentUser}).populate('status').populate('currencyId');
        res.json(withdrawals);
    } catch (err) {
        console.log('err', err);
        res.status(500).json({ message: err.message });
    }
});

// Get a single currency by ID
router.get('/:id', getWithdraw, (req, res) => {
  res.json(res.withdraw);
});

router.post('/approve/:id',async (req, res)=>{

  try {

    let id = req.params.id;

    let existingWithdrawalData = await WithdrawTransaction.findById(id).populate('status');;

    if(existingWithdrawalData.status.name != "Inprogress"){
      res.status(500).json({ message: 'Invalid Request' });
      return 
    }

    console.log(existingWithdrawalData);
    let statusRef = await StatusRef.findOne({type:"deposit", name:"Approved"});
    let statusRefId = statusRef._id;
    console.log('statusref', statusRefId);
    let response = await WithdrawTransaction.findOneAndUpdate({_id:id}, {status:statusRefId});


    console.log('respones',response);

    let existingUserWallet = await Wallet.findOne({userId:response.userId});

    console.log('existingUserWallet', existingUserWallet);

    let walletAmt;
    let userId = response.userId;
    let currencyId = response.currencyId;

    if(existingUserWallet == null){
        res.json(500).json({message:"Please enter Deposit for withdrawals."})
    }else{

        if(existingUserWallet.amount < (parseFloat(response.amount) + parseFloat(response.charge))){
            res.status(500).json("please enter amount less than wallet amount");
            return
        }
      //existing
      walletAmt = existingUserWallet.amount - (parseFloat(response.amount) + parseFloat(response.charge));
      let walletResponse = await Wallet.updateOne({userId:userId} ,{
        amount:walletAmt,
        userId:userId,
        currencyId:currencyId
      });
      console.log('walletResponse', walletResponse);
    }

    res.status(200).json(response);
  } catch (error) {
    console.log('error', error);
    res.status(500).json({ message: err.message });
  }

});

router.post('/reject/:id',async (req, res)=>{

  try {
    let id = req.params.id;

    let existingWithdrawalData = await WithdrawTransaction.findById(id).populate('status');

    if(existingWithdrawalData.status.name != "Inprogress"){
      res.status(500).json({ message: 'Invalid Request' });
      return 
    }

    console.log(existingWithdrawalData);
    let statusRef = await StatusRef.findOne({type:"deposit", name:"Rejected"});
    let statusRefId = statusRef._id;
    console.log('statusref', statusRefId);
    let response = await WithdrawTransaction.findOneAndUpdate({_id:id}, {status:statusRefId})

    console.log('res', req.params.id);
    res.status(200).json(response);
  } catch (error) {
    console.log('error', error);
    res.status(500).json({ message: err.message });
  }

})


// Create a new withdrawals
router.post('/', async (req, res) => {
    try {
    let charge = 0;
    let afterCharge = parseFloat(req.body.amount) - charge;

    let statusRef = await StatusRef.findOne({type:"deposit", name:"Inprogress"});
    let statusRefId = statusRef._id;

    let currency = await Currency.findOne({baseCurrency:1});
    let currencyId = currency._id;

    let existingUserWallet = await Wallet.findOne({userId:req.user.userId});

    if(existingUserWallet==null || existingUserWallet.amount < (parseFloat(req.body.amount) + parseFloat(charge))){
        res.status(500).json({message : "Invalid Request"});
        return
    }

    const withdrawal = new WithdrawTransaction({
    amount: parseFloat(req.body.amount), 
    charge: charge,
    afterCharge: afterCharge,
    status:statusRefId,
    transactionMode: req.body.transactionMode,
    currencyId:currencyId,
    transactionRef: req.body.transactionRef,
    userId:req.user.userId,
    });
    const newWithdraw = await withdrawal.save();
    res.status(201).json(newWithdraw);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
async function getWithdraw(req, res, next) {
  let withdraw;
  try {
    withdraw = await WithdrawTransaction.findById(req.params.id);
    if (withdraw == null) {
      return res.status(404).json({ message: 'Withdraw not found' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.withdraw = withdraw;
  next();
}

module.exports = router;

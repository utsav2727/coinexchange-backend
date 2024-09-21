// routes/currencyRoutes.js
const express = require('express');
const router = express.Router();
const DepositTransaction = require('../model/DepositTransaction');
const StatusRef = require('../model/StatusRef');
const Currency = require('../model/Currency');
const Wallet = require('../model/Wallet');
const Transaction = require('../model/Transactions');

router.get('/', async (req, res) => {
  try {
    const deposits = await DepositTransaction.find().populate('status').populate('currencyId').populate('userId');
    res.json(deposits);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/depositByUser', async (req, res) => {
    try {
        let currentUser = req.user.userId;
        const deposits = await DepositTransaction.find({userId:currentUser}).populate('status').populate('currencyId');
        res.json(deposits);
      } catch (err) {
        console.log('err', err);
        res.status(500).json({ message: err.message });
    }
});

// Get a single currency by ID
router.get('/:id', getDeposit, (req, res) => {
  res.json(res.deposit);
});

router.post('/approve/:id',async (req, res)=>{

  try {

    let id = req.params.id;

    let existinDepositData = await DepositTransaction.findById(id).populate('status');;

    if(existinDepositData!=null && existinDepositData.status.name != "Inprogress"){
      res.status(500).json({ message: 'Invalid Request' });
      return 
    }

    console.log(existinDepositData);
    let statusRef = await StatusRef.findOne({type:"deposit", name:"Approved"});
    let statusRefId = statusRef._id;
    console.log('statusref', statusRefId);
    let response = await DepositTransaction.findOneAndUpdate({_id:id}, {status:statusRefId});


    console.log('respones',response);

    let existingUserWallet = await Wallet.findOne({userId:response.userId});

    console.log('existingUserWallet', existingUserWallet);

    let walletAmt;
    let userId = response.userId;
    let currencyId = response.currencyId;

    if(existingUserWallet == null){
      //new create
      walletAmt = (parseFloat(response.amount) - parseFloat(response.charge));
      let walletResponse = await Wallet.create({
        amount:walletAmt,
        userId:userId,
        currencyId:currencyId
      });
      console.log('walletResponse', walletResponse);
      
      await Transaction.create({
        userId: userId, 
        type: "credit",
        amount:walletAmt
      });

    }else{
      //existing
      walletAmt = existingUserWallet.amount + (parseFloat(response.amount) - parseFloat(response.charge));
      let walletResponse = await Wallet.updateOne({userId:userId} ,{
        amount:walletAmt,
        userId:userId,
        currencyId:currencyId
      });
      console.log('walletResponse', walletResponse);
      await Transaction.create({
        userId: userId, 
        type: "credit",
        amount:walletAmt
      });
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

    let existinDepositData = await DepositTransaction.findById(id).populate('status');

    if(existinDepositData.status.name != "Inprogress"){
      res.status(500).json({ message: 'Invalid Request' });
      return 
    }

    console.log(existinDepositData);
    let statusRef = await StatusRef.findOne({type:"deposit", name:"Rejected"});
    let statusRefId = statusRef._id;
    console.log('statusref', statusRefId);
    let response = await DepositTransaction.findOneAndUpdate({_id:id}, {status:statusRefId})

    console.log('res', req.params.id);
    res.status(200).json(response);
  } catch (error) {
    console.log('error', error);
    res.status(500).json({ message: err.message });
  }

})


// Create a new currency
router.post('/', async (req, res) => {
    try {
    let charge =  0;
    let afterCharge = parseFloat(req.body.amount) - charge;

    let statusRef = await StatusRef.findOne({type:"deposit", name:"Inprogress"});
    let statusRefId = statusRef._id;

    let currency = await Currency.findOne({baseCurrency:1});
    let currencyId = currency._id;

    const deposit = new DepositTransaction({
    amount: parseFloat(req.body.amount), 
    charge: charge,
    afterCharge: afterCharge,
    status:statusRefId,
    transactionMode: req.body.transactionMode,
    currencyId:currencyId,
    transactionRef: req.body.transactionRef,
    userId:req.user.userId,
    });
    const newDeposit = await deposit.save();
    res.status(201).json(newDeposit);
  } catch (err) {
    console.log('err',err);
    res.status(400).json({ message: err.message });
  }
});



// Update an existing currency
// router.put('/:id', getDeposit, async (req, res) => {
//   if (req.body.name != null) {
//     res.currency.name = req.body.name;
//   }
//   if (req.body.symbol != null) {
//     res.currency.symbol = req.body.symbol;
//   }
//   if (req.body.tag != null) {
//     res.currency.tag = req.body.tag;
//   }
//   if (req.body.conversionRate != null) {
//     res.currency.conversionRate = req.body.conversionRate;
//   }

//   try {
//     const updatedCurrency = await res.currency.save();
//     res.json(updatedCurrency);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// });

// Delete a currency
// router.delete('/:id', getDeposit, async (req, res) => {
//   try {
//     await res.currency.deleteOne();  // Updated line
//     res.json({ message: 'Currency deleted' });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// Middleware to get a currency by ID
async function getDeposit(req, res, next) {
  let deposit;
  try {
    deposit = await DepositTransaction.findById(req.params.id);
    if (deposit == null) {
      return res.status(404).json({ message: 'Deposit not found' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.deposit = deposit;
  next();
}

module.exports = router;

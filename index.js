const express = require("express");
const ejs = require("ejs");
const mongoose = require("Mongoose");
const moment = require("moment");
const flash = require("connect-flash");
const session= require("express-session");

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({extended: false}));

app.set('trust proxy', 1)
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 60000 }
}))

app.use(flash());

//mongoose connection
mongoose.connect("mongodb://localhost:27017/bankDB",{useNewUrlParser:true, useUnifiedTopology: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("db connected");
});

// customer model
const customerSchema = new mongoose.Schema({
    _id: Number,
    name: String,
    accNum: String,
    email: String,
    balance: Number
});

const Customer = mongoose.model("Customer", customerSchema);

// transaction model
const transactionSchema = new mongoose.Schema({
    sender: String,
    receiver: String,
    amount: Number,
    date: String
});

const Transaction = mongoose.model("Transaction", transactionSchema);


const updateBalance = async(_id, newBalance) =>{
    try{
        const updatedCus= await Customer.updateOne({_id}, {
            $set:{
                balance : newBalance
            }
        }, {
            new:true
        });
        console.log(updatedCus);
        console.log("successfull updatd");
    }
    catch(err){
        console.log(err);
    }
    
}
// console.log(moment().utcOffset(330).format('Do MMMM YYYY, h:mm:ss a'));
function addTransactionHistory(s,r,a){

    const history = new Transaction({
        sender: s,
        receiver: r,
        amount: a,
        date: moment().utcOffset(330).format('Do MMMM YYYY, h:mm:ss a')
    });
    
    history.save((err, result) =>{
        if(!err) console.log(result._id);
        else console.log(err);
    })
};

// Routes
app.get("/", function(req, res){
    res.render("index",{title: "JSR Bank"});
});

app.get("/customer", function(req, res){
    Customer.find({}, (err, customerList)=>{
        if (!err){
            res.render("customer",{
                title: "Customer List",
                customers: customerList,
                success: req.flash("Success")
            });
        } else {
            console.log(err);
        }
    })
});

app.get("/transaction", function(req, res){

    Transaction.find({},(err, transHistory)=>{
        if (!err){
            res.render("transaction",{
                title:"Transaction History",
                transactions: transHistory
            });
        } else {
            console.log(err);
        } 
    });
});

app.get("/about", function(req, res){
    res.render("about", {title: "About Us"});
});

app.get("/transferMoney", function(req ,res){

    Customer.find({},function(err, customerList){
        if(!err){
            res.render("transfermoney", {
                title:"Transfer Money",
                customers: customerList,
                error: req.flash("Error")
            });
        } else {
            console.log(err);
        }
    })
    
});

app.post("/transferMoney", function(req, res){
    // console.log(req.body.senderName, req.body.receiverName, req.body.amount);
    var sender = req.body.senderName ;
    var receiver =req.body.receiverName;
    let amount = req.body.amount;

    if(amount>0){
        Customer.find({name: sender}, function(err, s){
            if(parseFloat(amount)>parseFloat(s[0].balance)){
                //    
            } else{
                let newBalance = parseFloat(s[0].balance) - parseFloat(amount);
                updateBalance(s[0]._id, newBalance)
            }
            
        });
    
        Customer.find({name: receiver}, function(err, r){
            let newBalance = parseFloat(r[0].balance) + parseFloat(amount);
            updateBalance(r[0]._id, newBalance);
            addTransactionHistory(sender, receiver, amount);
            req.flash("Success", "Transaction Successful")
            res.redirect("/customer");
        });
    } else {
        req.flash("Error", "Error: Please enter correct amount");
        res.redirect("/transferMoney");
    }
  
});


app.get("/:name", function(req, res){

    (async function(){
        const customer = await Customer.findOne({name: req.params.name}).exec();
        // console.log(customer);
        if(customer){
            res.render("person", {
                title: customer.name,
                person: customer
            });
        }
      
    })()
    
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
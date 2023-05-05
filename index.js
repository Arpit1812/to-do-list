const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const { name } = require("ejs");
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect('mongodb+srv://admin-Arpit:Test123@to-do-listdb.jyvrjw5.mongodb.net/to-do-list?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB', err));

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const listSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  items:  [itemSchema]
}, {
  timestamps: true
});

const Item = mongoose.model("Item", itemSchema);
const List = mongoose.model("List", listSchema);

const item1 = new Item({
  name: "Arpit dogra is here"
});

const item2 = new Item({
  name: "Arpit the king is here"
});

const item3 = new Item({
  name: "Arpit the lord is here"
});

const defaultItems = [item1, item2, item3];

app.get("/", async function (req, res) {
  try {
    const allItems = await Item.find({}).exec();
    if (allItems.length === 0) {
      await Item.insertMany(defaultItems);
      console.log('successfully added to MongoDB');
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: allItems });
    }
  } catch (err) {
    console.error('Could not add to the DataBase', err);
    res.status(500).send("Server error!");
  }
});

app.get("/:customListName", async function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  try {
    const foundList = await List.findOne({ name: customListName }).exec();
    if (!foundList) {
      // Create a new list
      const newList = new List({
        name: customListName,
        items: defaultItems
      });
      await newList.save();
      res.redirect("/" + customListName);
    } else {
      // Show an existing list
      res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
    }
  } catch (err) {
    console.error(err);
  }
});

app.post("/", async function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  try {
    if (listName === "Today") {
      await item.save();
      res.redirect("/");
    } else {
      const foundList = await List.findOne({ name: listName });
      foundList.items.push(item);
      await foundList.save();
      res.redirect("/" + listName);
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Server error!");
  }
});
    

app.post("/delete", async function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  try {
    if (listName === "Today") {
      await Item.findByIdAndRemove(checkedItemId);
      console.log("Successfully deleted checked item.");
      res.redirect("/");
    } else {
      await List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}});
      res.redirect("/" + listName);
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Server error!");
  }
});
  
app.get("/about", function (req,res) {
    res.render("about");    
} );


app.listen(3000, function () {
    console.log("The server is running");
});

const mongoose = require("mongoose");
const StatusRef = require("../model/StatusRef");
require('dotenv').config()

mongoose.connect(process.env.DB_URL);

async function createStatusRefs() {
  try {
    const statuses = [
      { type: "deposit", name: "Pending" },
      { type: "deposit", name: "Inprogress" },
      { type: "deposit", name: "Approved" },
      { type: "deposit", name: "Rejected" },
      { type: "trade", name: "posted" },
      { type: "trade", name: "blocked" },
      { type: "trade", name: "completed" },
    ];

    for (const status of statuses) {
      const statusRef = new StatusRef(status);
      await statusRef.save();
    }

    console.log("Status references created");
    mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
}

createStatusRefs();

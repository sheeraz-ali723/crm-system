const Activity = require("../models/Activity");

async function logActivity({ type = "Note", title, description = "", customer = null, customerName = "", performedBy = "Sheeraz Ali" }) {
  try {
    if (!title) return;
    await Activity.create({
      type,
      title,
      description,
      customer,
      customerName,
      performedBy,
      date: new Date(),
    });
  } catch (err) {
    console.error("Activity log error:", err.message);
  }
}

module.exports = { logActivity };

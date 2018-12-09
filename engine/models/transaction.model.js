const mongoose = require('mongoose');

module.exports = (db, ns) => {
  var schema = new mongoose.Schema({
    userId: String,
    currency: String,
    date: { type: Date, index: true },
    key: {
      type: String,
      trim: true,
      index: {
        unique: true,
        partialFilterExpression: { key: { $type: 'string' } }
      }
    },
    amount: String,
    data: mongoose.Schema.Types.Mixed
  });
  return db.model('Transaction', schema, `${ns}_transaction`);
};

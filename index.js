const mongoose = require('mongoose');
const EventEmitter = require('events');
const createLock = require('./engine/lock');
const createTransactionModel = require('./engine/models/transaction.model');
const createWalletService = require('./engine/services/wallet.service');

const defaultConfigs = {
  ns: 'basic-ledger'
};

const LedgerEngine = (mongoUrl, redisClients, configs) => {
  configs = {
    ...defaultConfigs,
    ...configs
  };
  // init lock
  if (!Array.isArray(redisClients)) redisClients = [redisClients];
  const lock = createLock(redisClients, configs.ns);

  // init db and models
  const db = mongoose.createConnection(mongoUrl);
  const Transaction = createTransactionModel(db, configs.ns);
  const emitter = new EventEmitter();

  // init services
  const WalletService = createWalletService(Transaction, lock, emitter);

  // exposing everything
  return {
    ...WalletService,
    Transaction,
    on: emitter.on.bind(emitter),
    clear: async () => {
      await Transaction.remove({});
    },
    close: async () => {
      try {
        await Transaction.collection.drop();
      } catch (e) {}
      mongoose.disconnect();
      for (let redisClient of redisClients) {
        redisClient.quit();
      }
    }
  };
};

module.exports = LedgerEngine;

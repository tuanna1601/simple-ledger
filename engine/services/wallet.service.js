const BigNumber = require('bignumber.js');

const guid = require('../guid');

module.exports = (Transaction, lock, emitter) => {
  const deposit = async (
    currency,
    userId,
    amount,
    tx = `test-${currency}-${userId}-${Date.now()}-${guid()}`
  ) => {
    amount = new BigNumber(amount);
    if (amount.lt('0')) {
      throw new Error('Deposit amount could not be less than zero.');
    }

    const transaction = await Transaction.create({
      currency,
      userId,
      amount: amount.toString(),
      key: `${currency}:deposit:${tx}`,
      date: new Date(),
      data: {
        type: 'deposit',
        tx
      }
    });
    emitter.emit('userWalletChanged', currency, userId);
    return transaction;
  };
  const withdraw = async (
    currency,
    userId,
    amount,
    tx = `test-${currency}-${userId}-${Date.now()}-${guid()}`
  ) => {
    amount = new BigNumber(amount);
    if (amount.lt('0')) {
      throw new Error('Withdraw amount could not be less than zero.');
    }
    const [balance, mutex] = await getBalanceAndLock(currency, userId);
    if (amount.gt(balance)) {
      await mutex.unlock();
      throw new Error('Withdraw amount could not be greater than balance.');
    }
    const transaction = await Transaction.create({
      currency,
      userId,
      amount: amount.negated().toString(),
      key: `${currency}:withdraw:${tx}`,
      date: new Date(),
      data: {
        type: 'withdraw',
        tx
      }
    });
    await mutex.unlock();
    emitter.emit('userWalletChanged', currency, userId);
    return transaction;
  };

  const createTransaction = async (currency, userId, amount, key, data) => {
    amount = new BigNumber(amount);

    const transaction = await Transaction.create({
      currency,
      userId,
      amount: amount.toString(),
      key: key,
      date: new Date(),
      data
    });
    emitter.emit('userWalletChanged', currency, userId);
    return transaction;
  };

  const getTransactions = async (currency, userId) => {
    const transactions = await Transaction.find({ currency, userId });
    return transactions;
  };

  const getBalanceAndLock = async (currency, userId) => {
    const mutex = await lock.lock(`${currency}/${userId}`, 10000);
    const balance = await getBalance(currency, userId);
    return [balance, mutex];
  };

  const getBalance = async (currency, userId) => {
    const transactions = await Transaction.find({ currency, userId });
    let balance = new BigNumber(0);
    for (let tx of transactions) {
      balance = balance.plus(tx.amount);
    }
    return balance.toString();
  };

  return {
    deposit,
    withdraw,
    getBalance,
    getBalanceAndLock,
    createTransaction,
    getTransactions
  };
};

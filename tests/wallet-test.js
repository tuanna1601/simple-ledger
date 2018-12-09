const LedgerEngine = require('../index');
const redisClient = require('redis').createClient();
const engine = LedgerEngine('mongodb://localhost/ledger', redisClient, {
  ns: `test-${Math.random()}`
});

afterAll(async () => {
  await engine.clear();
  engine.close();
});

beforeEach(async () => await engine.clear());

describe('deposit+getBalance', () => {
  it('deposit should return a not null transaction', async () => {
    const tx = await engine.deposit('btc', 1, 1000);
    expect(tx).not.toBeNull();
  });

  it('deposit should effect balance', async () => {
    let balance = await engine.getBalance('btc', 1);
    expect(balance).toBe('0');
    await engine.deposit('btc', 1, 1000);
    balance = await engine.getBalance('btc', 1);
    expect(balance).not.toBe('0');
  });

  it('cannot deposit negative amount', async () => {
    await expect(engine.deposit('btc', 1, -1000)).rejects.toThrow();
  });

  it('deposit multiple times should effect balance', async () => {
    let balance = await engine.getBalance('btc', 1);
    expect(balance).toBe('0');
    for (var i = 0; i < 10; i++) {
      await engine.deposit('btc', 1, 1000);
      let newBalance = await engine.getBalance('btc', 1);
      expect(balance).not.toEqual(newBalance);
      balance = newBalance;
    }
    expect(balance).toBe('10000');
  });

  it('deposit on multiple currency/userId works', async () => {
    for (let i = 0; i < 10; i++) {
      await engine.deposit('btc', 1, 1000);
    }
    for (let i = 0; i < 2; i++) {
      await engine.deposit('eth', 1, 1000);
    }
    for (let i = 0; i < 5; i++) {
      await engine.deposit('btc', 2, 1000);
    }
    const btcBalanceOf1 = await engine.getBalance('btc', 1);
    const btcBalanceOf2 = await engine.getBalance('btc', 2);
    const ethBalanceOf1 = await engine.getBalance('eth', 1);
    expect(btcBalanceOf1).toBe('10000');
    expect(btcBalanceOf2).toBe('5000');
    expect(ethBalanceOf1).toBe('2000');
  });
});

describe('withdraw', () => {
  it('cannot withdraw negative amount', async () => {
    expect(engine.withdraw('btc', 1, -1000)).rejects.toThrow();
  });

  it('cannot withdraw an amount larger than balance', async () => {
    await expect(engine.withdraw('btc', 1, 1000)).rejects.toThrow();
  });

  it('withdraw will never make balance go below zero', async () => {
    await engine.deposit('btc', 1, 1000);

    // make Transaction.create slow
    const originalCreate = engine.Transaction.create;
    engine.Transaction.create = (...args) =>
      new Promise((resolve, reject) => {
        setTimeout(() => {
          originalCreate
            .apply(engine.Transaction, args)
            .then(resolve)
            .catch(reject);
        }, 10);
      });

    try {
      await Promise.all(
        [0, 1, 2, 3, 4].map(i => engine.withdraw('btc', 1, 500))
      );
    } catch (e) {}

    const balance = await engine.getBalance('btc', 1);
    expect(balance).toBe('0');
    engine.Transaction.create = originalCreate;
  });
});

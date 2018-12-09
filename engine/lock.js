const Redlock = require('redlock');

module.exports = (redisClients, ns) => {
  const redlock = new Redlock(redisClients, {
    driftFactor: 0.01,
    retryCount: 10,
    retryDelay: 200
  });


  return {
    lock: (name, ttl) => redlock.lock(`${ns}:${name}`, ttl)
  };
};

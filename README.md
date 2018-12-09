# Simple Ledger

NodeJS implementation of a simple ledger for wallet services

# Requirements

- NodeJS: 10.13.x
- Redis
- MongoDb

# Get started

## Setup

```bash
npm install simple-ledger
```

## Init SimpleLedger:

```
const SimpleLedger = require('simple-ledger');
const redisClient = require('redis').createClient();

const ledger = SimpleLedger(MONGODB_URI, redisClient, {
    ns: NAMESPACE
});
```

# TODO

Finish documentations

# Simple Ledger

NodeJS implementation of a simple ledger for wallet services

# Requirements

- NodeJS: 10.13.x
- Redis
- MongoDb

# Get started

## Setup

```bash
npm install basic-ledger
```

## Init BasicLedger:

```
const BasicLedger = require('basic-ledger');
const redisClient = require('redis').createClient();

const ledger = BasicLedger(MONGODB_URI, redisClient, {
    ns: NAMESPACE
});
```

# TODO

Finish documentations

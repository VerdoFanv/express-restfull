# Testing

Jest-style layout under `test/`:

```text
test/
  helpers/       Shared test app + config
  mocks/         In-memory repositories
  unit/          Service & middleware unit tests
  integration/   HTTP API tests (supertest)
```

```bash
npm test                 # all (Jest)
npm run test:unit
npm run test:integration
npm run test:cover
```

Unit tests exercise services with memory repos (no Postgres/Redis/RabbitMQ).
Integration tests mount the real routers with the same contract as production.

.PHONY: deps infra-up infra-down docker-up docker-down docker-build docker-logs api worker test test-unit test-integration test-cover lint typecheck build ci prisma-push

deps:
	npm install

infra-up:
	docker compose up -d postgres redis rabbitmq

infra-down:
	docker compose down

docker-build:
	docker compose build api worker

docker-up:
	docker compose up -d --build

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f api worker

api:
	npm run dev

worker:
	npm run dev:worker

prisma-push:
	npx prisma db push

test:
	npm test

test-unit:
	npm run test:unit

test-integration:
	npm run test:integration

test-cover:
	npm run test:cover

lint:
	npm run lint

typecheck:
	npm run typecheck

build:
	npm run build

ci:
	npm run ci

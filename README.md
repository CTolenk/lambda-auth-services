# Lambda Auth Service

Lambda-oriented authentication service following a hexagonal architecture. Each Lambda lives in `lambdas/` with shared utilities under `lambdas/shared/`.

## Local Development
- Install deps per Lambda: `cd lambdas/auth-register && npm install`.
- Build handler bundle: `npm run build`.
- Run tests: `npm test`.
- Local entrypoint (`npm start`) builds and invokes `dist/index.js`, auto-setting:
  - `USERS_TABLE_NAME=auth-users-local` (unless already defined)
  - `AWS_REGION=us-east-1` (unless already defined)
  - `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` dummy values for local use
  - `DYNAMODB_ENDPOINT=http://localhost:8000` (unless already defined)

## DynamoDB Local

### Option 1 — Docker
1. Ensure Docker is running.
2. Launch DynamoDB Local:  
   `docker run --name dynamodb-local -p 8000:8000 amazon/dynamodb-local`
3. Keep the container running while you exercise the Lambda locally.

### Option 2 — Java Runtime
1. Download the archive:  
   `curl -O https://s3.us-west-2.amazonaws.com/dynamodb-local/dynamodb_local_latest.tar.gz`
2. Extract the files:  
   `tar -xzf dynamodb_local_latest.tar.gz`
3. Start DynamoDB Local (from the extracted directory):  
   `java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb -port 8000`

> Both options expose DynamoDB Local on `http://localhost:8000`, matching the defaults used by `npm start`. Set `DYNAMODB_ENDPOINT` if you need a custom host/port.

### Bootstrap Local Tables
Create the users table once per environment (default name: `auth-users-local`):

```
aws dynamodb create-table \
  --table-name auth-users-local \
  --attribute-definitions AttributeName=email,AttributeType=S \
  --key-schema AttributeName=email,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url http://localhost:8000 \
  --region us-east-1
```

You can verify it with:

```
aws dynamodb list-tables --endpoint-url http://localhost:8000 --region us-east-1
```

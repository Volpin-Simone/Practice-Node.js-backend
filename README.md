# Node.js Practice Backend

A backend API built to learn professional Node.js/Express development patterns. The focus is on how things are structured in real projects: layered architecture, authentication, centralized error handling, validation, and testing.

## Stack

- Node.js / Express 5
- Prisma 7 (MariaDB adapter)
- JWT authentication with refresh tokens and session revocation
- bcrypt for password hashing
- Zod for request validation
- Vitest + Supertest for testing

## Features

- User registration, profile updates, and account deletion
- Login with short-lived access tokens and long-lived refresh tokens
- Session tracking, so refresh tokens can be individually revoked
- Role-based authorization (user / admin)
- Request validation via Zod schemas
- Centralized error handling
- Rate limiting on authentication routes
- Health check endpoints
- 40+ automated tests

## API Endpoints

| Method | Endpoint                | Auth required          | Description               |
|--------|-------------------------|------------------------|---------------------------|
| POST   | /users                  | No                     | Register a new user       |
| GET    | /users/:userId          | Admin                  | Get a user by ID          |
| PUT    | /users/me               | Yes                    | Update your own profile   |
| PATCH  | /users/me/password *    | Yes                    | Change your password      |
| DELETE | /users/me               | Yes                    | Delete your own account   |
| POST   | /auth/login *           | No                     | Log in, receive tokens    |
| POST   | /auth/refresh *         | Refresh token (body)   | Exchange refresh token    |
| GET    | /health/live            | No                     | Liveness check            |
| GET    | /health/ready           | No                     | Readiness check (DB)      |

\* Rate-limited to prevent brute-force / abuse

## Getting Started

**Prerequisites:** Node.js, and a running MySQL or MariaDB server you can connect to.

1. Install dependencies:

```bash
npm install
```


2. Create a `.env` file in the project root:

```
JWT_SECRET=
JWT_EXPIRES_IN=
REFRESH_TOKEN_SECRET=
REFRESH_TOKEN_EXPIRES_IN=
SESSION_DURATION_DAYS=
DATABASE_HOST=
DATABASE_PORT=
DATABASE_USER=
DATABASE_PASSWORD=
DATABASE_NAME=
DATABASE_URL=
```


3. Generate the Prisma Client (required - it's not committed to the repo):

```bash
npx prisma generate
```


4. Push the schema to your database (this also creates the database itself if it doesn't already exist):

```bash
npx prisma db push
```


5. Run the dev server:

```bash
npm run dev
```


6. To run the tests, first create a `.env.test` file with the same variable names, pointed at a separate database - update both `DATABASE_NAME` and `DATABASE_URL` to the new name, since they're two independent values that both need to agree. Then push the schema to it:

```bash
npm run prisma:test
```


7. Run the tests:

```bash
npm test
```
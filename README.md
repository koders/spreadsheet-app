This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

- Run fe-challenge docker server

```bash
docker pull stakingrewards/engineering-frontend-challenge:latest

docker run --name fe-challenge -d -p 8082:8081 stakingrewards engineering-frontend-challenge:latest
```

- Run the FE development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

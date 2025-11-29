# Fatima LMS

A Learning Management System built with Nuxt 3 and Directus.

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Directus Configuration
NUXT_PUBLIC_DIRECTUS_URL=your_directus_url_here

# Directus Admin Token (for user registration)
# Generate this token from your Directus admin panel
DIRECTUS_ADMIN_TOKEN=your_admin_token_here
```

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## Database & Seeding

After setting `DATABASE_URL` (for example `mysql://user:password@host:3306/database`), run migrations and seed demo data:

```bash
npm run db:migrate
npm run db:seed
```

The seed script clears existing course data, inserts the sample live courses with levels and lectures, and assigns every course to the first user in the database (if one exists).

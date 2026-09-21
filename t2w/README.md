This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Application data

The existing server JSON store is `t2w/.local/organizations` (relative to the repository), with one file per organization and the existing `encryption.key`. Keep this directory together: the key is needed to read encrypted passwords and invitation secrets. It is ignored by Git.

Organization lists, creation, code/invite joining, roles, availability and meetings are read and written through `/api/organization-access`. No browser organization/workspace snapshot is used to initialize or overwrite server records. Client workspace caches are memory-only. Anonymous Quick Meet access uses HttpOnly cookies; old browser access credentials can be read for compatibility without modifying or deleting the old browser data. Only the appearance preference is still written to localStorage.

This change does not migrate, rename, rewrite or delete pre-existing JSON files. Browser-only historical previews are retained but are not automatically imported into the server store. Tests create isolated temporary storage directories and do not use existing organization data.

For deployment, mount the JSON directory on persistent storage. While running localhost, these files live on the development computer; this is not a cloud database. Do not run multiple server instances against separate copies of this directory.

# Scan and Secure

Scan and Secure is a warranty verification app built around QR codes. It helps manufacturers register products, generate warranty QR codes, track customer claims, and reduce duplicate or counterfeit warranty registrations.

Customers can scan a product QR code, activate the warranty, view their registered warranties, and download warranty certificates.

## Project Structure

```text
admin/      React admin portal for manufacturers
customer/   React customer portal for scanning and warranty lookup
server/     Express API, MongoDB models, QR generation, claims, and jobs
```

## Main Features

- Admin login and manufacturer product management
- Product CSV import and image upload support
- QR code batch generation, export, and printable PDF labels
- Customer QR scan flow using camera or image upload
- Warranty activation, certificate download, and claim history
- Admin analytics, claim review, and expiry reminder workflow

## Local Setup

Install root and app dependencies:

```bash
npm install
npm run install:all
```

Create the server environment file:

```bash
cp server/.env.example server/.env
```

Required server values:

```text
MONGODB_URI=mongodb://localhost:27017/omniwarranty
JWT_SECRET=replace-with-a-long-random-secret
```

Frontend API URL:

```text
VITE_API_URL=http://localhost:5000/api
```

Run all apps together:

```bash
npm run dev
```

Default local URLs:

```text
API health: http://localhost:5000/api/health
Admin app:  http://localhost:5174
Customer:   http://localhost:5173
```

## Useful Commands

```bash
npm run dev:server
npm run dev:admin
npm run dev:customer
npm run build --prefix admin
npm run build --prefix customer
npm test --prefix server
```

## Development Roles

The project work is split like a small four-person team:

- Backend developers: API routes, MongoDB models, authentication, product and claim workflows, QR/PDF generation, expiry jobs, and server-side reliability.
- Frontend developers: admin dashboard, product and QR screens, customer scan flow, warranty pages, accessibility, and frontend validation.

## Notes

This repository is organized as a single product with three apps. Keep backend changes inside `server/`, admin-facing UI changes inside `admin/`, and customer-facing UI changes inside `customer/`.

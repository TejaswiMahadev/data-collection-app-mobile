# Running Vita-Inspire

Vita-Inspire is an Expo-based mobile application with an Express backend. This guide will walk you through setting up and running the project locally.

## Prerequisites

Ensure you have the following installed on your system:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- [PostgreSQL](https://www.postgresql.org/) (Required for data persistence)
- [Expo Go](https://expo.dev/expo-go) app on your mobile device (iOS/Android)

---

## 1. Setup

### Installation
Clone the repository and install dependencies:
```bash
npm install
```

### Environment Variables
The application requires certain environment variables to be set. Create a `.env` file in the root directory (or use your system environment):

```env
DATABASE_URL=postgresql://username:password@localhost:5432/vitainspire
PORT=5000
```

> [!NOTE]
> If `DATABASE_URL` is not provided, the server will fall back to an in-memory storage (`MemStorage`), meaning data will be lost when the server restarts.

### Database Migration
If you are using PostgreSQL, sync your database schema using Drizzle:
```bash
npm run db:push
```

---

## 2. Running the Backend

Start the Express server in development mode:
```bash
npm run server:dev
```
The server will be available at `http://localhost:5000`.

---

## 3. Running the Expo App

Start the Expo development server:
```bash
npm run start
```

### Viewing the App
- **Mobile**: Scan the QR code displayed in your terminal using the **Expo Go** app (Android) or the **Camera app** (iOS).
- **Web**: Press `w` in the terminal to open the web version in your browser.

> [!TIP]
> Ensure your mobile device and computer are on the same Wi-Fi network for the Expo Go app to connect.

---

## 4. Troubleshooting

- **Windows Environment Variables**: If you see an error like `'NODE_ENV' is not recognized`, ensure `cross-env` is installed (`npm install --save-dev cross-env`). The scripts have been updated to use it.
- **EPERM: mkdir 'C:\Users\...\.expo'**: This is a permission issue. Try running your terminal as Administrator, or run:
  ```bash
  npx expo start --localhost
  ```
- **Database Connection**: Ensure PostgreSQL is running and your `DATABASE_URL` is correct.
- **Port Conflicts**: If port 5000 is occupied, change the `PORT` in your `.env` file.
- **Expo Connection**: If the QR code doesn't work, try running `npx expo start --tunnel` if you are behind a firewall or have network issues.
- **Clean Install**: If you encounter dependency issues, try deleting `node_modules` and running `npm install` again.
npx cross-env USERPROFILE="C:\Users\d jashwanth sai\Downloads\Vita-Inspire\Vita-Inspire" npx expo start --localhost --web
npm run server:dev
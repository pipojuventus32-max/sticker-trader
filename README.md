# Sticker Trader (Web)

This is the web frontend built with **React + Vite + TypeScript**.

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Share with friends (host online)

The built site is plain static files in `dist/`. Put it on any static host and send people the link.

### Vercel (free tier)

1. Push this repo to [GitHub](https://github.com).
2. Sign in at [vercel.com](https://vercel.com) and **Import** the repository.
3. Vercel detects Vite; leave defaults (build: `npm run build`, output: `dist`).
4. After deploy, copy the URL (e.g. `https://your-app.vercel.app`) and share it.

`vercel.json` includes a SPA fallback so future client-side routes keep working.

### Other options

- **Netlify**: New site from Git, build `npm run build`, publish directory `dist`.
- **Cloudflare Pages**: Connect the repo, build command `npm run build`, output `dist`.

On a phone, friends can open the link in the browser and use **Add to Home Screen** for an app-like shortcut (no store required).

# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

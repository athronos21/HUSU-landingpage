# HUSU Telegram Bot — Setup Guide

## Overview
When an admin posts in the Telegram channel, the post automatically appears on the website.

---

## Step 1 — Create Telegram Channels

1. Open Telegram → New Channel
2. Create **HUSU News** → set username `@HUSU_News`, make it **Public**
3. Create **HUSU Events** → set username `@HUSU_Events`, make it **Public**

---

## Step 2 — Create the Bot

1. Open Telegram → search `@BotFather`
2. Send `/newbot`
3. Name: `HUSU Bot`
4. Username: `HUSUOfficialBot` (must end in "bot")
5. Save the **token** you receive

6. Add the bot as **Administrator** to both channels:
   - Open channel → Edit → Administrators → Add Admin → search your bot

---

## Step 3 — Deploy to Cloudflare Workers (Free)

1. Go to https://workers.cloudflare.com → sign up free (no credit card)
2. Click **Create a Worker**
3. Delete the default code, paste the contents of `worker.js`
4. Click **Save and Deploy**
5. Note your worker URL: `https://husu-telegram-bot.YOUR-NAME.workers.dev`

---

## Step 4 — Set Environment Variables

In Cloudflare Workers dashboard → your worker → **Settings → Variables**

Add these as **Secret** variables:

| Variable         | Value                                      |
|------------------|--------------------------------------------|
| `BOT_TOKEN`      | Your bot token from BotFather              |
| `FIREBASE_API_KEY` | `AIzaSyD6BvM4649Hh1IYzQbSl9QAfSjFq0bERe4` |
| `PROJECT_ID`     | `husu-f7abc`                               |
| `NEWS_CHANNEL`   | `HUSU_News` (without @)                    |
| `EVENTS_CHANNEL` | `HUSU_Events` (without @)                  |
| `WEBHOOK_SECRET` | Any random string e.g. `husu_secret_2025`  |

---

## Step 5 — Register the Webhook

Open this URL in your browser (replace values):

```
https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://husu-telegram-bot.YOUR-NAME.workers.dev&secret_token=husu_secret_2025
```

You should see: `{"ok":true,"result":true,"description":"Webhook was set"}`

---

## Step 6 — Update Firestore Security Rules

In Firebase Console → Firestore → Rules, add write access for unauthenticated REST writes
to news and events (scoped by a field check):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Existing auth rules...
    match /news/{doc} {
      allow read: if true;
      allow write: if request.auth != null
                   || request.resource.data.source == 'telegram';
    }
    match /events/{doc} {
      allow read: if true;
      allow write: if request.auth != null
                   || request.resource.data.source == 'telegram';
    }
  }
}
```

---

## How to Post

### News post (in @HUSU_News channel):
```
Title: HUSU Holds General Assembly
Category: Announcement

The Haramaya University Students' Union successfully held its
first General Assembly of the academic year...
```

### Event post (in @HUSU_Events channel):
```
Title: Annual Sports Day
Date: 2025-07-15
Time: 8:00 AM – 5:00 PM
Location: HU Sports Ground
Category: Sports

A full day of inter-department sports competitions...
```

You can also attach a **photo** — it will be uploaded automatically.

### Valid Categories:
- News: `Announcement`, `Academic`, `Service`, `Discipline`
- Events: `Sports`, `Academic`, `Workshop`, `Culture`

---

## Security Note
After setup, go to `@BotFather` → `/mybots` → your bot → **Revoke token**
and generate a new one, then update the `BOT_TOKEN` variable in Cloudflare.
This is because the old token was shared insecurely.

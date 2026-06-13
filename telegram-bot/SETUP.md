# HUSU Telegram Bot — Setup Guide

## Overview

News and events are published **only via Telegram**. Each affair head is added as an admin
to the shared channels. They post using the standard format and tag their affair.
Posts appear on the website automatically within seconds.

---

## Step 1 — Create the Telegram Channels

Create two public channels:

| Channel | Username | Purpose |
|---------|----------|---------|
| HUSU News | `@HUSU_News` | All news from all affairs |
| HUSU Events | `@HUSU_Events` | All events from all affairs |

To create: Telegram → New Channel → set as **Public** → set the username.

---

## Step 2 — Create the Bot

1. Open Telegram → search `@BotFather`
2. Send `/newbot`
3. Name: `HUSU Official Bot`
4. Username: `HUSUOfficialBot` (must end in "bot")
5. **Save the token** you receive

---

## Step 3 — Add Bot + Affair Heads as Channel Admins

For **each channel** (News and Events):

1. Open channel → Edit → Administrators → Add Admin
2. Add the **bot** (`@HUSUOfficialBot`) with **Post Messages** permission
3. Add each **affair head** by their Telegram username with **Post Messages** permission

**Affair heads are assigned by affair name:**
- Academic Affair Head → added as admin with name/note "Academic"
- Discipline Affair Head → added as admin with name/note "Discipline"  
- Service Affair Head → added as admin with name/note "Service"

When they post, they include `Affair: Academic` (or Discipline/Service) in the post
so the website correctly tags and filters the content.

---

## Step 4 — Deploy to Cloudflare Workers

1. Go to https://workers.cloudflare.com → sign up free
2. Click **Create a Worker**
3. Delete default code, paste contents of `worker.js`
4. Click **Save and Deploy**
5. Note your worker URL: `https://husu-telegram-bot.YOUR-NAME.workers.dev`

---

## Step 5 — Set Environment Variables

In Cloudflare Workers dashboard → your worker → **Settings → Variables → Add variable** (use **Secret** for sensitive values):

| Variable | Value | Type |
|----------|-------|------|
| `BOT_TOKEN` | Your bot token from BotFather | Secret |
| `FIREBASE_API_KEY` | `AIzaSyD6BvM4649Hh1IYzQbSl9QAfSjFq0bERe4` | Secret |
| `PROJECT_ID` | `husu-f7abc` | Secret |
| `NEWS_CHANNELS` | `HUSU_News` | Text |
| `EVENTS_CHANNELS` | `HUSU_Events` | Text |
| `WEBHOOK_SECRET` | Any random string e.g. `husu_secret_2025` | Secret |
| `WORKER_SECRET` | Any random string e.g. `husu_worker_2025` | Secret |

**Multiple channels:** If you want separate channels per affair, add them comma-separated:
- `NEWS_CHANNELS` = `HUSU_News,HUSU_Academic_News,HUSU_Discipline_News`
- `EVENTS_CHANNELS` = `HUSU_Events,HUSU_Academic_Events,HUSU_Service_Events`

---

## Step 6 — Register the Telegram Webhook

Open this URL in your browser (replace values):

```
https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://husu-telegram-bot.YOUR-NAME.workers.dev&secret_token=husu_secret_2025
```

Expected response: `{"ok":true,"result":true,"description":"Webhook was set"}`

---

## Step 7 — Verify

Check the worker is running:
```
https://husu-telegram-bot.YOUR-NAME.workers.dev/health
```
Should return: `{"ok":true,"worker":"husu-telegram-bot"}`

---

## Post Format

### News Post (in @HUSU_News):
```
Title: Peer Tutoring Program Launched
Category: Academic
Affair: Academic

The Academic Affair has launched a peer tutoring initiative...
```

### Event Post (in @HUSU_Events):
```
Title: Annual Sports Day
Date: 2026-07-15
Time: 8:00 AM – 5:00 PM
Location: HU Sports Ground
Category: Sports
Affair: Service

A full day of inter-department sports competitions...
```

**Valid News Categories:** `Announcement` · `Academic` · `Service` · `Discipline`  
**Valid Event Categories:** `Sports` · `Academic` · `Workshop` · `Culture`  
**Valid Affairs:** `Academic` · `Discipline` · `Service` (or any affair name you use)

Attach a **photo** to any post — it uploads automatically to the website.

---

## Security Notes

- Only channel admins can post (Telegram enforces this)
- The bot token and worker secret must be kept private
- The `WORKER_SECRET` protects the `/create-user` endpoint used by the dashboard

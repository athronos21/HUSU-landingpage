# HUSU Telegram Post Format Guide

## 📰 NEWS POST — send to @HUSU_News

```
Title: Your News Title Here
Category: Announcement
Affair: Academic

Write your full news description here.
You can use multiple lines.
```

### Rules:
- `Title:` — required
- `Category:` — optional, one of: `Announcement` · `Academic` · `Service` · `Discipline` (defaults to `Announcement`)
- `Affair:` — optional, name of the affair posting (e.g. `Academic`, `Discipline`, `Service`)
- Leave a **blank line** between the fields and the description
- Attach a **photo** if needed — uploads automatically

### Example:
```
Title: Peer Tutoring Program Launched
Category: Academic
Affair: Academic

The Academic Affair has launched a peer tutoring initiative
connecting high-performing students with those who need support,
covering key courses across all colleges.
```

---

## 📅 EVENT POST — send to @HUSU_Events

```
Title: Event Name Here
Date: YYYY-MM-DD
Time: 8:00 AM – 5:00 PM
Location: Venue Name
Category: Academic
Affair: Academic

Write your full event description here.
You can use multiple lines.
```

### Rules:
- `Title:` — required
- `Date:` — format `YYYY-MM-DD` (e.g. `2026-07-15`), also accepts `15/07/2026`
- `Time:` — optional
- `Location:` — optional (also accepts `Venue:`)
- `Category:` — optional, one of: `Sports` · `Academic` · `Workshop` · `Culture` (defaults to `Academic`)
- `Affair:` — optional, name of the affair organizing the event
- Leave a **blank line** between the fields and the description

### Example:
```
Title: Annual Sports Day
Date: 2026-07-15
Time: 8:00 AM – 5:00 PM
Location: HU Sports Ground
Category: Sports
Affair: Service

A full day of inter-department sports competitions including
football, volleyball, and athletics.
```

---

## ⚠️ Common Mistakes

| Wrong | Right |
|-------|-------|
| `title: Sports Day` | `Title: Sports Day` |
| `Date: 15/07/2026` | `Date: 2026-07-15` (preferred) |
| `Category: sport` | `Category: Sports` |
| No blank line before description | Always leave one blank line |

---

## ✅ Valid Categories

| For News (@HUSU_News) | For Events (@HUSU_Events) |
|-----------------------|---------------------------|
| Announcement          | Sports                    |
| Academic              | Academic                  |
| Service               | Workshop                  |
| Discipline            | Culture                   |

---

## 🏛️ Valid Affairs
- Academic
- Discipline  
- Service
- *(add more as needed)*

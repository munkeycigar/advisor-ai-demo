# Advisor AI — Meeting Prep & Client Outreach Demo

A demo application showcasing how AI can automate meeting preparation and personalized client emails for wealth management firms. Built with React + Vite, powered by Claude (Anthropic API).

## What It Does

- **Meeting Prep Brief** — AI reads mock CRM/portfolio data and generates a comprehensive one-pager for the advisor before a client meeting
- **Follow-Up Email Drafts** — AI drafts personalized post-meeting emails referencing specific client details, life events, and action items

## Mock Data

The app includes 4 fictional ExxonMobil clients at different life stages:

1. **Robert Hargrove** — Pre-retiree VP evaluating pension lump sum vs annuity
2. **Mei-Lin Zhang** — Mid-career engineer exploring Mega Roth strategy
3. **Thomas Brennan** — Recently retired, post-divorce estate plan update
4. **Sandra Okafor** — Surviving spouse managing RMDs and charitable giving

Each client has realistic CRM profiles, portfolio data, life events, meeting history, and open action items.

## Setup

```bash
npm install
npm run dev
```

You'll need an [Anthropic API key](https://console.anthropic.com/) — enter it in the app via the "Set API Key" button. The key stays client-side only.

## Tech Stack

- React 18 + Vite
- Tailwind CSS
- Anthropic Claude API (streaming)

## License

MIT

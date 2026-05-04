# pcyoa-core Demo UI

This is a minimal vanilla TypeScript viewer for the current core.

It is intentionally small. It exists to make the core feel alive:

- Cards update from `PlaySnapshot`.
- Clicking a card sends a `PlayerAction`.
- The Availability State Machine accepts or rejects the move.
- Points are derived from selection state.
- Locked cards show requirement explanations.
- The Weighted Matrix panel shows story gravity and strong next cards.

Run it with:

```sh
npm run demo
```

Then open the local URL printed by Vite.

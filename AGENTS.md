<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- AI calls go through `src/lib/ai.server.ts` (streamed Responses API) and are exposed via server functions in `src/lib/eco.functions.ts`; keeps the key server-side.
- User points, cart and activity live in browser localStorage (`src/lib/eco-store.ts`); no backend accounts yet.
- Reward rules (points, milestones, eco tiers) live only in `src/lib/rewards.ts` with tests beside it.

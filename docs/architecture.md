# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- **Presentation tier:** Keep each capability in its existing React component and use the shared API client for relative `/api` requests. Render API data and provide accessible loading, empty, and error states; keep business rules out of the UI.
- **Logic tier:** Keep route handlers thin and put input validation, persistence orchestration, and response shaping in the Express service layer. Return deliberate 4xx responses for invalid input, malformed IDs, missing referenced records, and unknown users rather than exposing database cast errors as 500s.
- **Data tier:** Use Mongoose models as the source of schema validation and references. Require the contract fields for users, teams, activities, and workouts; default team members to an empty array, and preserve the seed script's idempotence and unrelated records.
- **Activity tracking:** Accept a user's and team's IDs, activity type, and positive minutes; verify both referenced records exist before saving. Compute points as one point per minute and set `occurredAt` when the activity is created. Keep listing and creation responses in the API contract's shapes.
- **Team management:** Reject a missing or blank name with `400`. Create and list teams with their submitted name and mascot, and retain valid member IDs without requiring a member to already have a team.
- **Leaderboard:** Aggregate activity points by team, include teams with no activity at zero points, sort by total points descending, and assign 1-based ranks in the response.
- **Workout suggestions:** Find the user by email, consider recent activity alongside their fitness goal, and put the best matching available workout first with a reason tied to the user's goal or activity. Return a 4xx when no user matches.

## Test plan

Run the focused contract tests after each tier is implemented, then run both builds. A failing data contract points to model validation/defaults or seed behavior; a failing API contract points to service behavior, persistence, or response/status contracts; a failing frontend contract points to rendering, API integration, or accessible request states. A build failure indicates a TypeScript or production-bundling problem even if contract tests pass.

- `npm run test:data --prefix octofit-tracker/backend` — **4 failed, 1 passed.** User, team, activity, and workout required-field validations are missing; the idempotent seed contract passes.
- `npm run test:api --prefix octofit-tracker/backend` — **4 failed.** Invalid activity/team payloads return `501` instead of `400`, the leaderboard is empty, and the first workout suggestion does not match the user's activity/goal.
- `npm test --prefix octofit-tracker/frontend` — **15 failed.** Capability data is not rendered as required, and loading, empty, and API error states are missing or inaccessible.
- `npm run build --prefix octofit-tracker/backend` — **passed.**
- `npm run build --prefix octofit-tracker/frontend` — **passed.**

Implementation order: fix and rerun the data contracts first; implement and rerun the API contracts against those models second; then implement and rerun the presentation contracts. Finish by rerunning both builds and all three test commands together.

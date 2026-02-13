# PSD Feature Patch

This zip contains new/modified files to add the PSD feature into your existing `mgsecure/react-boilerplate` repo.

## What’s included
- Client route `/psd` added to `client/src/app/routes.jsx`
- New client feature folder `client/src/psd/**`
- Shared schemas/constants `shared/src/**`
- Server optional routes mounted at `/api/psd/*` (stubs by default)
- Client unit tests for histogram/stat functions (Vitest)
- Playwright e2e skeleton

## How to apply
Copy the contents of this patch into your repo, preserving paths.

Then:
1. Add Nivo deps to `client/package.json` (this patch provides an updated file)
2. Run `yarn install`
3. Run `yarn test`
4. Start app: `yarn dev`

## Notes
- This patch ships an initial pure-JS image pipeline (no OpenCV). ArUco detection + perspective warp are TODOs and will be wired next.

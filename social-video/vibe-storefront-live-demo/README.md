# Vibe Storefront Live Demo Video

This workspace builds a 16:9 social demo video for Vibe Storefront.

The source is split by tool:

- `hyperframes/` owns the kinetic title, wait, and CTA scenes.
- `remotion/` owns the final edit, staged app scenes, and MP4 render.
- `scripts/` owns live capture and asset preparation.

Generated media is intentionally ignored by Git. Keep source files here, but do
not commit captured production footage, rendered clips, or final MP4s unless
that is explicitly requested.

## Workflow

Run these from this directory unless noted otherwise.

```bash
npx -y -p node@24 -c 'npm --prefix remotion install'
```

The edit uses a low-volume CC0 lo-fi instrumental bed and no voiceover. Keep
the story readable from the on-screen deck language.

From the repo root, run production smoke before creating live footage:

```bash
npx -y -p node@24 -c 'npm run smoke:production'
```

The default render uses a staged Remotion app-flow mock because Google sign-in
blocks automated Chromium with "This browser or app may not be secure." This
keeps the video production-safe and avoids writing demo rows to production.

Before the final pass, replace `shareUrl` in
`remotion/src/generated/demo-capture.ts` with the real generated storefront URL.

If you still want a real capture later, the optional headed Playwright script is:

```bash
npx -y -p node@24 -c 'node scripts/capture-live-demo.mjs'
```

If the browser is not signed in, the script pauses before recording. Google OAuth
may reject this browser; use Clerk email/password if available, or record with a
normal signed-in browser outside Playwright.

Render HyperFrames into the Remotion public asset folder:

```bash
cd hyperframes
npx -y hyperframes@0.5.7 lint
npx -y hyperframes@0.5.7 inspect --samples 15
npx -y hyperframes@0.5.7 render --output ../remotion/public/hyperframes/kinetic-scenes.mp4 --quality standard
```

Render the final edit:

```bash
cd remotion
npx remotion still VibeStorefrontSocialDemo --frame=30 --scale=0.25 --output ../renders/still-frame-30.png
npx remotion render src/index.ts VibeStorefrontSocialDemo ../renders/vibe-storefront-social-demo.mp4
```

Verify the final media:

```bash
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,codec_name -show_entries format=duration -of default=noprint_wrappers=1 ../renders/vibe-storefront-social-demo.mp4
```

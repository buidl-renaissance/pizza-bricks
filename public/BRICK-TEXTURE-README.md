# Brick background texture

Sections with the brick background use a real texture when this file is present:

- **Filename:** `brick-texture.png` (or `brick-texture.jpg` if you change the URL in `LandingSection.tsx`)
- **Place:** this folder (`public/`)

**Included:** `brick-texture.png` — CC0 seamless brick from [OpenGameArt](https://opengameart.org/node/15802) (512×512).

## Swap for a different texture (CC0)

1. **ambientCG – Bricks038** (photorealistic, seamless)
   - https://ambientcg.com/view?id=Bricks038
   - Download **1K-JPG** zip, unzip, use the Color map as `brick-texture.jpg` and update the URL in `LandingSection.tsx` to `/brick-texture.jpg`.

2. **CC0 Textures – brick**
   - https://cc0-textures.com/c/brick
   - Pick a seamless brick, save here and point the component at it.

If the texture file is missing, the app falls back to a CSS brick pattern.

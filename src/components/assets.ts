import backgroundUrl from '../../assets/ui_scene_background.png';
import menuShipUrl from '../../assets/png/default/ships/ship_2.png';
import rankingStarUrl from '../../assets/png/retina/ui/hud/icon_score.png';

const MENU_IMAGES = import.meta.glob(
  '../../assets/png/retina/ui/{menu,controls}/*.png',
  { eager: true, import: 'default' },
) as Record<string, string>;

let menuAssets: Promise<void> | undefined;

export function loadMenuAssets() {
  menuAssets ??= loadImages([
    backgroundUrl,
    menuShipUrl,
    rankingStarUrl,
    ...Object.values(MENU_IMAGES),
  ]).catch((error: unknown) => {
    menuAssets = undefined;
    throw error;
  });
  return menuAssets;
}

async function loadImages(urls: string[]) {
  await Promise.all(urls.map(loadImage));
}

async function loadImage(url: string) {
  const image = new Image();
  image.src = url;
  await image.decode();
}

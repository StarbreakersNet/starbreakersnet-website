// Verre dépoli des widgets sur une photo, sans backdrop-filter : une miniature floue du fond d'écran
// est calculée une seule fois (canvas), puis affichée derrière chaque widget à la même position que
// le fond (background-attachment: fixed). Aucun calcul de flou à chaque image.
// Impossible pour une image d'un autre site qui n'autorise pas sa lecture (CORS) : null, les widgets
// gardent alors un verre simplement plus opaque.

const WIDTH = 96;

export function createBackdrop(source: string): Promise<string | null> {
  return new Promise(resolve => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => {
      try {
        const height = Math.max(1, Math.round((WIDTH * image.naturalHeight) / image.naturalWidth));
        const canvas = document.createElement("canvas");
        canvas.width = WIDTH;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) return resolve(null);
        // Réduction très forte + léger flou : l'agrandissement par le navigateur fait le reste
        context.filter = "blur(2px) saturate(1.4)";
        context.drawImage(image, 0, 0, WIDTH, height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      } catch {
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
    image.src = source;
  });
}

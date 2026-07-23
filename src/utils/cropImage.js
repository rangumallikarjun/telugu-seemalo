export function getCroppedImg(imageSrc, cropPixels) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(cropPixels.width);
      canvas.height = Math.round(cropPixels.height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(
        image,
        cropPixels.x, cropPixels.y, cropPixels.width, cropPixels.height,
        0, 0, canvas.width, canvas.height
      );
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error("Could not process image")); return; }
        resolve(blob);
      }, "image/jpeg", 0.92);
    };
    image.onerror = () => reject(new Error("Could not load image"));
  });
}

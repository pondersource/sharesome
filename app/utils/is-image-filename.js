export default function isImageFilename(name) {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(name);
}

export default function mediaURL(value) {
  if (!value) return value;
  const url = new URL(value);
  if (url.hostname === 'www.dropbox.com' || url.hostname === 'dropbox.com') {
    url.searchParams.delete('dl');
    url.searchParams.set('raw', '1');
    return url.href;
  }
  return value;
}

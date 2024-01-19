export function secondsToTime(seconds: number) {
  if (seconds % 60 < 10) {
    return Math.floor(seconds / 60) + ':0' + Math.floor(seconds % 60);
  } else {
    return Math.floor(seconds / 60) + ':' + Math.floor(seconds % 60);
  }
}

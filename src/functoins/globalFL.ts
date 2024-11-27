export async function WaitForMilliseconds(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function RandomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
export function parseErrorCode(code: number | undefined, translate: (key: string) => string): string {
  if (code === 2001) {
    return translate('device_offline');
  }
  return `Unknown Tuya error: ${code}`;
}

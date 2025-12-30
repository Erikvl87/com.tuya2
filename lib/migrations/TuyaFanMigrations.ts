import { executeMigration } from './MigrationStore';
import TuyaOAuth2DeviceFan from '../../drivers/fan/device';

export async function performMigrations(device: TuyaOAuth2DeviceFan): Promise<void> {
  await tuyaCapabilitiesMigration(device).catch(device.error);
  await fanDirectionMigration(device).catch(device.error);
}

async function tuyaCapabilitiesMigration(device: TuyaOAuth2DeviceFan): Promise<void> {
  await executeMigration(device, 'fan_tuya_capabilities', async () => {
    device.log('Migrating Tuya capabilities...');

    const tuyaCapabilities = [];

    const status = await device.getStatus();
    for (const tuyaCapability in status) {
      if (tuyaCapability === 'switch' || tuyaCapability === 'fan_speed_percent') {
        tuyaCapabilities.push(tuyaCapability);
      }
    }

    await device.setStoreValue('tuya_capabilities', tuyaCapabilities);

    device.log('Tuya capabilities added:', tuyaCapabilities);
  });
}

async function fanDirectionMigration(device: TuyaOAuth2DeviceFan): Promise<void> {
  await executeMigration(device, 'reversed_fan_direction', async () => {
    device.log('Migrating reverse fan direction...');

    // Default value
    let reverseFanDirection = 'backward';

    const deviceSpecs =
      (await device.oAuth2Client
        .getSpecification(device.data.deviceId)
        .catch(e => device.log('Device specification retrieval failed', e))) ?? undefined;

    if (deviceSpecs?.status !== undefined) {
      for (const statusSpecification of deviceSpecs.status) {
        const tuyaCapability = statusSpecification.code;
        const values: Record<string, unknown> = JSON.parse(statusSpecification.values);
        if (tuyaCapability === 'fan_direction') {
          reverseFanDirection = (values.range as string[])[1];
          break;
        }
      }
    }

    await device.setStoreValue('reversed_fan_direction', reverseFanDirection);

    device.log('Tuya reverse fan direction set:', reverseFanDirection);
  });
}

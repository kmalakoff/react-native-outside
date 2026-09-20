import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { delimiter, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    platform: { type: 'string' },
    fixture: { type: 'string' },
    flow: { type: 'string' },
    'android-gradle-java-home': { type: 'string' },
    'skip-build': { type: 'boolean' },
    'skip-maestro': { type: 'boolean' },
  },
});
const platform = values.platform;
if (!values.fixture) throw new Error('Pass --fixture');
const fixture = resolve(values.fixture);
if (!existsSync(join(fixture, 'package.json'))) throw new Error(`Fixture does not exist: ${fixture}`);
const flow = resolve(values.flow ?? join(fixture, '.native/native-outside.yaml'));
const simulator = process.env.SIMULATOR_UDID;
const androidGradleJavaHome = values['android-gradle-java-home']?.trim();

function run(command: string, args: string[], cwd: string, env = process.env): void {
  const result = spawnSync(command, args, { cwd, env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed with ${result.status}`);
}

function resolveAndroidDevice(): string {
  const configuredDevice = process.env.ANDROID_SERIAL?.trim();
  const devicesResult = spawnSync('adb', ['devices'], { encoding: 'utf8' });
  if (devicesResult.error) throw devicesResult.error;
  if (devicesResult.status !== 0) throw new Error(`adb devices failed with ${devicesResult.status}`);
  const devices = devicesResult.stdout
    .split(/\r?\n/)
    .map((line) => line.trim().split(/\s+/))
    .filter(([serial, state]) => Boolean(serial) && state === 'device')
    .map(([serial]) => serial);
  const device = configuredDevice ?? (devices.length === 1 ? devices[0] : undefined);
  if (!device) throw new Error(`Expected exactly one online Android device, found ${devices.length}: ${devices.join(', ') || '<none>'}`);
  if (!devices.includes(device)) throw new Error(`Configured ANDROID_SERIAL ${device} is not online: ${devices.join(', ') || '<none>'}`);

  const serialResult = spawnSync('adb', ['-s', device, 'get-serialno'], { encoding: 'utf8' });
  if (serialResult.error) throw serialResult.error;
  if (serialResult.status !== 0) throw new Error(`adb -s ${device} get-serialno failed with ${serialResult.status}`);
  const serial = serialResult.stdout.trim();
  if (!serial || serial === 'unknown' || serial !== device) throw new Error(`adb get-serialno did not confirm device ${device}`);
  return serial;
}

if (!platform || !['android', 'ios'].includes(platform)) throw new Error('Pass --platform android or ios');
const app = JSON.parse(readFileSync(join(fixture, 'app.json'), 'utf8')) as { name: string; android: { package: string }; ios: { bundleIdentifier: string } };

if (androidGradleJavaHome && platform !== 'android') throw new Error('--android-gradle-java-home is only supported for Android');
if (androidGradleJavaHome) {
  const javaExecutable = process.platform === 'win32' ? 'java.exe' : 'java';
  if (!existsSync(join(androidGradleJavaHome, 'bin', javaExecutable))) {
    throw new Error(`Java executable not found under --android-gradle-java-home ${androidGradleJavaHome}`);
  }
}

if (!values['skip-build']) {
  run('npm', ['run', platform === 'android' ? 'build:android' : 'build:ios'], fixture);
}

if (platform === 'android') {
  const device = resolveAndroidDevice();
  const androidEnvironment = { ...process.env, ANDROID_SERIAL: device };
  const installEnvironment: NodeJS.ProcessEnv = { ...androidEnvironment };
  if (androidGradleJavaHome) {
    // RN 0.59 uses Gradle 5.4.1, so limit Java 8 to build/install. Emulator setup and Maestro use the default Java 17.
    installEnvironment.JAVA_HOME = androidGradleJavaHome;
    installEnvironment.PATH = `${join(androidGradleJavaHome, 'bin')}${delimiter}${installEnvironment.PATH ?? ''}`;
  }
  run('npm', ['run', 'android', '--', '--no-packager', '--appId', app.android.package], fixture, installEnvironment);
  if (!values['skip-maestro']) run('maestro', ['--device', device, 'test', flow], fixture, androidEnvironment);
} else {
  if (!simulator) throw new Error('SIMULATOR_UDID is required for iOS');
  if (existsSync(join(fixture, 'ios/Podfile'))) run('pod', ['install', '--project-directory=ios'], fixture);
  const derivedData = join(fixture, '.native/DerivedData');
  const workspace = join(fixture, `ios/${app.name}.xcworkspace`);
  const project = join(fixture, `ios/${app.name}.xcodeproj`);
  const xcodeContainer = existsSync(workspace) ? ['-workspace', workspace] : ['-project', project];
  run('xcodebuild', [...xcodeContainer, '-scheme', app.name, '-configuration', 'Debug', '-sdk', 'iphonesimulator', '-destination', `id=${simulator}`, '-derivedDataPath', derivedData, 'build'], fixture);
  const nativeAppName = app.name === 'OutsideSmoke' ? 'ReactTestApp' : app.name;
  const appPath = join(derivedData, `Build/Products/Debug-iphonesimulator/${nativeAppName}.app`);
  run('xcrun', ['simctl', 'install', simulator, appPath], fixture);
  run('xcrun', ['simctl', 'launch', simulator, app.ios.bundleIdentifier], fixture);
  if (!values['skip-maestro']) run('maestro', ['--device', simulator, 'test', flow], fixture);
}

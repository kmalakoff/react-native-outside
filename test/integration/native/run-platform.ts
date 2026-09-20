import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { delimiter, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    platform: { type: 'string' },
    fixture: { type: 'string' },
    flow: { type: 'string' },
    'android-gradle-java-home': { type: 'string' },
    'skip-build': { type: 'boolean' },
    'skip-maestro': { type: 'boolean' },
    'legacy-ios-xcode-compat': { type: 'boolean' },
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
const legacyIOSXcodeCompat = Boolean(values['legacy-ios-xcode-compat']);

function applyLegacyIOSXcodeCompat(): void {
  if (platform !== 'ios') throw new Error('--legacy-ios-xcode-compat is only supported for iOS');
  if (app.name !== 'NativeMatrixMinimum') throw new Error('--legacy-ios-xcode-compat is only supported for the NativeMatrixMinimum fixture');

  const reactNativePackagePath = join(fixture, 'node_modules/react-native/package.json');
  if (!existsSync(reactNativePackagePath)) {
    throw new Error('--legacy-ios-xcode-compat requires installed React Native 0.59.10 in the fixture');
  }
  const reactNativePackage = JSON.parse(readFileSync(reactNativePackagePath, 'utf8')) as { version?: string };
  if (reactNativePackage.version !== '0.59.10') {
    throw new Error(`--legacy-ios-xcode-compat requires React Native 0.59.10, found ${reactNativePackage.version ?? '<unknown>'}`);
  }

  const bridgePath = join(fixture, 'node_modules/react-native/React/CxxBridge/RCTCxxBridge.mm');
  if (!existsSync(bridgePath)) throw new Error('--legacy-ios-xcode-compat could not find the RN 0.59.10 RCTCxxBridge.mm source');
  const fixtureRealPath = realpathSync(fixture);
  const bridgeRealPath = realpathSync(bridgePath);
  const bridgeRelativePath = relative(fixtureRealPath, bridgeRealPath);
  if (isAbsolute(bridgeRelativePath) || bridgeRelativePath === '..' || bridgeRelativePath.startsWith(`..${sep}`)) {
    throw new Error('--legacy-ios-xcode-compat refuses to patch a source file outside the fixture');
  }

  // Pin both the saved RN 0.59.10 source and its sole exploratory annotation edit.
  const stockSHA256 = '138a74557cc63713ad755f5c4796c89f2154738c1bca9f1139742b24e39c1cad';
  const patchedSHA256 = '9d72c849501515b0ff7c070a76f3962adb41d67dab89472c924ae6961df37885';
  const originalAnnotation = '- (NSArray<RCTModuleData *> *)_initializeModules:(NSArray<id<RCTBridgeModule>> *)modules';
  const patchedAnnotation = '- (NSArray<RCTModuleData *> *)_initializeModules:(NSArray<Class> *)modules';
  const source = readFileSync(bridgeRealPath, 'utf8');
  const sourceSHA256 = createHash('sha256').update(source).digest('hex');
  if (sourceSHA256 === patchedSHA256) {
    console.log(`Exploratory iOS Xcode compatibility enabled for React Native 0.59.10; RCTCxxBridge annotation patch SHA-256 ${patchedSHA256} is already applied.`);
    return;
  }
  if (sourceSHA256 !== stockSHA256) {
    throw new Error(`--legacy-ios-xcode-compat found unexpected RCTCxxBridge.mm SHA-256 ${sourceSHA256}`);
  }
  if (source.split(originalAnnotation).length - 1 !== 1) {
    throw new Error('--legacy-ios-xcode-compat expected exactly one known _initializeModules annotation');
  }

  const patchedSource = source.replace(originalAnnotation, patchedAnnotation);
  if (createHash('sha256').update(patchedSource).digest('hex') !== patchedSHA256) {
    throw new Error('--legacy-ios-xcode-compat generated an unexpected RCTCxxBridge.mm patch');
  }
  writeFileSync(bridgeRealPath, patchedSource);
  console.log(`Exploratory iOS Xcode compatibility enabled for React Native 0.59.10; verified stock SHA-256 ${stockSHA256} and applied RCTCxxBridge annotation patch SHA-256 ${patchedSHA256}.`);
}

if (androidGradleJavaHome && platform !== 'android') throw new Error('--android-gradle-java-home is only supported for Android');
if (legacyIOSXcodeCompat) applyLegacyIOSXcodeCompat();

if (androidGradleJavaHome) {
  const javaExecutable = process.platform === 'win32' ? 'java.exe' : 'java';
  if (!existsSync(join(androidGradleJavaHome, 'bin', javaExecutable))) {
    throw new Error(`Java executable not found under --android-gradle-java-home ${androidGradleJavaHome}`);
  }
}

if (!values['skip-build']) {
  const buildArgs = ['run', platform === 'android' ? 'build:android' : 'build:ios'];
  if (legacyIOSXcodeCompat) buildArgs.push('--', '--max-workers', '1');
  run('npm', buildArgs, fixture, {
    ...process.env,
    ...(legacyIOSXcodeCompat ? { NODE_OPTIONS: [process.env.NODE_OPTIONS, '--openssl-legacy-provider'].filter(Boolean).join(' ') } : {}),
  });
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
  const configuration = legacyIOSXcodeCompat ? 'Release' : 'Debug';
  const legacyIOSXcodeSettings = legacyIOSXcodeCompat ? ['IPHONEOS_DEPLOYMENT_TARGET=15.0', 'CLANG_WARN_STRICT_PROTOTYPES=NO', 'OTHER_CFLAGS=$(inherited) -Wno-error'] : [];
  run('xcodebuild', [...xcodeContainer, '-scheme', app.name, '-configuration', configuration, '-sdk', 'iphonesimulator', '-destination', `id=${simulator}`, '-derivedDataPath', derivedData, ...legacyIOSXcodeSettings, 'build'], fixture);
  const nativeAppName = app.name === 'OutsideSmoke' ? 'ReactTestApp' : app.name;
  const appPath = join(derivedData, `Build/Products/${configuration}-iphonesimulator/${nativeAppName}.app`);
  run('xcrun', ['simctl', 'install', simulator, appPath], fixture);
  run('xcrun', ['simctl', 'launch', simulator, app.ios.bundleIdentifier], fixture);
  if (!values['skip-maestro']) run('maestro', ['--device', simulator, 'test', flow], fixture);
}

const {execSync} = require('child_process');
const fs = require('fs');
const {
  getReactNativeProjectAppVersion,
} = require('appcenter-cli/dist/commands/codepush/lib/react-native-utils');
const minimist = require('minimist');
const path = require('path');
const crypto = require('crypto');
const HASH_ALGORITHM = 'sha256';
const FILE_TYPES = new Set(['gif', 'jpeg', 'jpg', 'png', 'svg', 'webp', 'xml']);

const ext = filePath => {
  const extname = path.extname(filePath);
  if (extname.startsWith('.')) {
    return extname.substr(1);
  }
  return extname;
};
const execCommand = command => execSync(command).toString().trim();
const rmRf = pathToRemove =>
  fs.rmSync(pathToRemove, {recursive: true, force: true});
const Platform = {
  android: 'android',
  ios: 'ios',
};

class AndroidConfig {
  constructor(entryFile) {
    this.entryFile = entryFile;
  }
  platform = Platform.android;
  output(outputPath) {
    return `${outputPath}/index.android.bundle`;
  }
}

class IOSConfig {
  constructor(entryFile) {
    this.entryFile = entryFile;
  }
  platform = Platform.ios;
  output(outputPath) {
    return `${outputPath}/main.jsbundle`;
  }
}

function getHermesOSBin() {
  switch (process.platform) {
    case 'win32':
      return 'win64-bin';
    case 'darwin':
      return 'osx-bin';
    case 'freebsd':
    case 'linux':
    case 'sunos':
    default:
      return 'linux64-bin';
  }
}

function bundleHermes(bundlePath) {
  const bundledHermesEngine = path.join(
    'node_modules',
    'react-native',
    'sdks',
    'hermesc',
    getHermesOSBin(),
    'hermesc',
  );
  const bundlePathHbc = bundlePath + '.hbc';
  const hermesArgs = [
    '-emit-binary',
    '-out',
    bundlePathHbc,
    bundlePath,
    '-w',
  ].join(' ');
  execCommand(`${bundledHermesEngine} ${hermesArgs}`);
  fs.copyFileSync(bundlePathHbc, bundlePath);
  rmRf(bundlePathHbc);
}

function bundle(output, config) {
  const bundleName = config.output(output);
  execCommand(`\
    yarn react-native bundle\
      --platform ${config.platform}\
      --dev false\
      --entry-file ${config.entryFile}\
      --bundle-output ${bundleName}\
      --assets-dest ${output}\
      --reset-cache\
    `);

  bundleHermes(bundleName);
}

const log = message => console.log(message);
const checkout = commit => execCommand(`git checkout ${commit}`);
function checkoutAndBuild(bundlerConfig, commit, prefix) {
  const tmpPath = path.join(prefix, commit.replaceAll(/\.|\//g, '_'));
  rmRf(tmpPath);
  fs.mkdirSync(tmpPath);
  log(`switch to ${commit}`);
  checkout(commit);
  log('install node_modules...');
  execCommand('yarn');
  log(`bundling for ${commit}`);
  bundle(tmpPath, bundlerConfig);
  log(`checkoutAndBuild output = ${tmpPath}`);

  return tmpPath;
}

function getAllFiles(folderName, result = [], prefix = '') {
  const folderFiles = fs.readdirSync(folderName);

  for (const file of folderFiles) {
    const fullPath = path.join(folderName, file);
    const stat = fs.statSync(fullPath);
    const relativePath = path.join(prefix, file);
    if (stat.isDirectory()) {
      getAllFiles(fullPath, result, relativePath);
    } else {
      result.push(relativePath);
    }
  }

  return result;
}

function fileExists(file) {
  try {
    return fs.statSync(file).isFile();
  } catch (e) {
    return false;
  }
}

async function fileHash(filePath) {
  const readStream = fs.createReadStream(filePath);
  const hashStream = crypto.createHash(HASH_ALGORITHM);

  return new Promise((resolve, reject) => {
    readStream
      .pipe(hashStream)
      .on('error', reject)
      .on('finish', function () {
        hashStream.end();
        const buffer = hashStream.read();
        const hash = buffer.toString('hex');
        resolve(hash);
      });
  });
}

function release(content, app, version = '') {
  execCommand(
    `yarn appcenter codepush release -a ${app} -c ${content} -t ${version} -d Staging`,
  );
}

async function diff(currentOutput, baseOutput) {
  const changed = [];
  for (const filePath of getAllFiles(currentOutput)) {
    if (!fileExists(path.join(baseOutput, filePath))) {
      changed.push(filePath);
      continue;
    }
    if (!FILE_TYPES.has(ext(filePath))) {
      continue;
    }
    const [currentHash, baseHash] = await Promise.all([
      fileHash(path.join(currentOutput, filePath)),
      fileHash(path.join(baseOutput, filePath)),
    ]);
    if (currentHash === baseHash) {
      fs.rmSync(path.join(currentOutput, filePath));
    } else {
      changed.push(filePath);
    }
  }

  fs.writeFileSync(
    path.join(currentOutput, 'changed.json'),
    JSON.stringify(changed),
  );
}

async function main({bundlerConfig, app, base}) {
  const platform = bundlerConfig.platform;
  log(`Checking version for ${platform}...`);
  const version = await getReactNativeProjectAppVersion({os: platform});
  log(`version for ${platform} is ${version}`);
  const current = execCommand('git rev-parse HEAD');
  const outputPath = 'codepush';
  rmRf(outputPath);
  fs.mkdirSync(outputPath);
  const baseOutput = checkoutAndBuild(bundlerConfig, base, outputPath);
  const currentOutput = checkoutAndBuild(bundlerConfig, current, outputPath);

  log('Diffing...');
  await diff(currentOutput, baseOutput);

  log('Releasing...');
  release(currentOutput, app, version);

  log('Disposing...');
  rmRf(outputPath);
}

const args = minimist(process.argv.slice(2));
const Bundler = args.p === Platform.android ? AndroidConfig : IOSConfig;

main({
  bundlerConfig: new Bundler('index.js'),
  app: args.a,
  base: args.b,
});

const os = require('os');
const childProcess = require('child_process');
const packageJson = require('../package.json');

const dependencies = packageJson.dependencies || {};

for (const packageName in dependencies) {
    const version = dependencies[packageName];
    console.log(`Installing ${packageName} version ${version}`);
    try {
        childProcess.execSync(`npm install ${packageName}@${version}`);
    } catch (error) {
        console.log(`Couldn't install pacakge ${packageName}@${packageVersion}`)
    }
}

const clientOs = os.platform();
const v = process.versions.node.split('.')[0]
const packageMap = {
    'win32': `@chilkat/ck-node${v}-win64`,
    'linux': `@chilkat/ck-node${v}-linux64`,
    'darwin': `@chilkat/ck-node${v}-macosx`
};

if (packageMap[clientOs]) {
    const packageName = packageMap[clientOs];
    console.log(`Installing ${packageName}`);
    try {
        childProcess.execSync(`npm install --no-save ${packageName}`);
    } catch (error) {
        console.log(`Couldn't install pacakge ${packageName}`)
    }
} else {
    console.error(`Unsupported operating system: ${clientOs}`);
    process.exit(1);
}
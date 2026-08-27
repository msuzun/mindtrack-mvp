const fs = require('fs');
const path = require('path');
const { withDangerousMod, withXcodeProject } = require('@expo/config-plugins');

const icons = [
  ['AppIcon-Midnight', 'icon-midnight.png'],
  ['AppIcon-PureLight', 'icon-pure-light.png'],
  ['AppIcon-SolarSunset', 'icon-solar-sunset.png'],
];

function contents(filename) {
  return JSON.stringify({
    images: [{ filename, idiom: 'universal', platform: 'ios', size: '1024x1024' }],
    info: { author: 'xcode', version: 1 },
  }, null, 2);
}

module.exports = function withAlternateAppIcons(config) {
  config = withDangerousMod(config, ['ios', async (modConfig) => {
    const iosRoot = modConfig.modRequest.platformProjectRoot;
    const projectName = modConfig.modRequest.projectName;
    const catalogRoot = path.join(iosRoot, projectName, 'Images.xcassets');
    fs.mkdirSync(catalogRoot, { recursive: true });
    for (const [setName, sourceName] of icons) {
      const setRoot = path.join(catalogRoot, `${setName}.appiconset`);
      fs.mkdirSync(setRoot, { recursive: true });
      fs.copyFileSync(path.join(modConfig.modRequest.projectRoot, 'assets', 'app-icons', sourceName), path.join(setRoot, sourceName));
      fs.writeFileSync(path.join(setRoot, 'Contents.json'), contents(sourceName));
    }
    return modConfig;
  }]);

  return withXcodeProject(config, (modConfig) => {
    const section = modConfig.modResults.pbxXCBuildConfigurationSection();
    for (const entry of Object.values(section)) {
      if (!entry || typeof entry !== 'object' || !entry.buildSettings) continue;
      entry.buildSettings.ASSETCATALOG_COMPILER_ALTERNATE_APPICON_NAMES = '"AppIcon-Midnight AppIcon-PureLight AppIcon-SolarSunset"';
      entry.buildSettings.ASSETCATALOG_COMPILER_INCLUDE_ALL_APPICON_ASSETS = 'YES';
    }
    return modConfig;
  });
};

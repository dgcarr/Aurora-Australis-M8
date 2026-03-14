const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const GRADLE_DISTRIBUTION_URL =
  'https\\://services.gradle.org/distributions/gradle-8.10.2-all.zip';

function updateGradleWrapper(contents) {
  const distributionLine = /^distributionUrl=.*$/m;
  if (distributionLine.test(contents)) {
    return contents.replace(distributionLine, `distributionUrl=${GRADLE_DISTRIBUTION_URL}`);
  }

  const needsNewline = contents.length > 0 && !contents.endsWith('\n');
  return `${contents}${needsNewline ? '\n' : ''}distributionUrl=${GRADLE_DISTRIBUTION_URL}\n`;
}

module.exports = function withPinnedGradleWrapper(config) {
  return withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const wrapperPath = path.join(
        modConfig.modRequest.projectRoot,
        'android',
        'gradle',
        'wrapper',
        'gradle-wrapper.properties'
      );

      if (!fs.existsSync(wrapperPath)) {
        throw new Error(
          `Expected Gradle wrapper properties at ${wrapperPath}, but the file does not exist.`
        );
      }

      const current = fs.readFileSync(wrapperPath, 'utf8');
      const updated = updateGradleWrapper(current);
      if (updated !== current) {
        fs.writeFileSync(wrapperPath, updated);
      }

      return modConfig;
    },
  ]);
};

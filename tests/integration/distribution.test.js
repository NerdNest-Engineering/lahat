/**
 * Integration tests for app distribution system
 * Tests packaging, installation, and validation of .lahat apps
 */

import { test, describe } from 'node:test';
import { strict as assert } from 'assert';
import path from 'path';
import fs from 'fs/promises';
import { 
  integrationTest, 
  assertFileExists,
  createMockFileStructure,
  countFiles
} from '../helpers/test-utils.js';
import { ProjectGenerator } from '../../src/scaffolding/ProjectGenerator.js';
import { AppPackager } from '../../src/distribution/AppPackager.js';
import { AppInstaller } from '../../src/distribution/AppInstaller.js';
import { AppValidator } from '../../src/distribution/AppValidator.js';

describe.skip('App Distribution Integration', () => {
  test('should package a generated project into .lahat file', integrationTest('app-packaging', async (t, { createTestDir }) => {
    // Setup - Generate a test project
    const projectsDir = await createTestDir('distribution-projects');
    const packagesDir = await createTestDir('distribution-packages');
    
    const generator = new ProjectGenerator({ outputDir: projectsDir });
    const projectPath = await generator.generateProject({
      name: 'test-package-app',
      template: 'minimal',
      description: 'Test app for packaging',
      author: 'Test Author'
    });
    
    // Package the project
    const packager = new AppPackager({ outputDir: packagesDir });
    const packagePath = await packager.packageApp(projectPath);
    
    // Verify package was created
    await assertFileExists(packagePath, 'Package file should exist');
    assert(packagePath.endsWith('.lahat'), 'Package should have .lahat extension');
    
    // Verify package file is not empty
    const stats = await fs.stat(packagePath);
    assert(stats.size > 0, 'Package file should not be empty');
    assert(stats.size > 1000, 'Package should contain meaningful content'); // Reasonable minimum size
    
    console.log(`✅ App packaging works correctly: ${path.basename(packagePath)}`);
  }));

  test('should install .lahat package and create working app', integrationTest('app-installation', async (t, { createTestDir }) => {
    // Setup - Create and package an app
    const projectsDir = await createTestDir('distribution-install-projects');
    const packagesDir = await createTestDir('distribution-install-packages'); 
    const installDir = await createTestDir('distribution-install-apps');
    
    // Generate project
    const generator = new ProjectGenerator({ outputDir: projectsDir });
    const projectPath = await generator.generateProject({
      name: 'test-install-app',
      template: 'ui-focused',
      description: 'Test app for installation',
      author: 'Test Author'
    });
    
    // Package project
    const packager = new AppPackager({ outputDir: packagesDir });
    const packagePath = await packager.packageApp(projectPath);
    
    // Install package
    const installer = new AppInstaller({ installDir });
    const installedPath = await installer.installApp(packagePath);
    
    // Verify installation
    await assertFileExists(installedPath, 'Installed app directory should exist');
    
    const expectedFiles = ['main.js', 'package.json', 'lahat.config.js', 'index.html', 'styles.css'];
    for (const file of expectedFiles) {
      await assertFileExists(path.join(installedPath, file), `${file} should be installed`);
    }
    
    // Verify package.json is valid
    const packageJsonPath = path.join(installedPath, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    assert.equal(packageJson.name, 'test-install-app');
    assert.equal(packageJson.type, 'module');
    
    console.log(`✅ App installation works correctly: ${path.basename(installedPath)}`);
  }));

  test('should validate app packages correctly', integrationTest('app-validation', async (t, { createTestDir }) => {
    // Setup
    const testDir = await createTestDir('distribution-validation');
    
    // Create valid app structure
    const validAppDir = path.join(testDir, 'valid-app');
    await createMockFileStructure(validAppDir, {
      'main.js': 'import { LahatAPI } from "@lahat/runtime"; console.log("Valid app");',
      'package.json': JSON.stringify({
        name: 'valid-test-app',
        version: '1.0.0',
        type: 'module',
        main: 'main.js',
        dependencies: { '@lahat/runtime': '^3.0.0' }
      }, null, 2),
      'lahat.config.js': 'export default { name: "valid-test-app", version: "1.0.0", permissions: ["lahat:storage"] };'
    });
    
    // Create invalid app structure (missing required files)
    const invalidAppDir = path.join(testDir, 'invalid-app');
    await createMockFileStructure(invalidAppDir, {
      'main.js': 'console.log("Missing package.json");'
    });
    
    // Create validator
    const validator = new AppValidator();
    
    // Test valid app
    const validResult = await validator.validateApp(validAppDir);
    assert.equal(validResult.isValid, true, 'Valid app should pass validation');
    assert.equal(validResult.errors.length, 0, 'Valid app should have no errors');
    assert(validResult.warnings.length >= 0, 'Warnings should be an array');
    
    // Test invalid app
    const invalidResult = await validator.validateApp(invalidAppDir);
    assert.equal(invalidResult.isValid, false, 'Invalid app should fail validation');
    assert(invalidResult.errors.length > 0, 'Invalid app should have errors');
    assert(invalidResult.errors.some(e => e.includes('package.json')), 'Should identify missing package.json');
    
    console.log(`✅ App validation works correctly`);
  }));

  test('should handle package metadata correctly', integrationTest('package-metadata', async (t, { createTestDir }) => {
    // Setup
    const projectsDir = await createTestDir('distribution-metadata-projects');
    const packagesDir = await createTestDir('distribution-metadata-packages');
    
    // Generate project with specific metadata
    const generator = new ProjectGenerator({ outputDir: projectsDir });
    const projectPath = await generator.generateProject({
      name: 'metadata-test-app',
      template: 'minimal',
      description: 'App with custom metadata',
      author: 'Metadata Author',
      permissions: ['lahat:storage', 'lahat:filesystem'],
      mcpRequirements: ['file-operations']
    });
    
    // Package with custom metadata
    const packager = new AppPackager({ 
      outputDir: packagesDir,
      includeMetadata: true
    });
    const packagePath = await packager.packageApp(projectPath, {
      version: '2.1.0',
      tags: ['utility', 'file-management'],
      license: 'MIT'
    });
    
    // Verify package metadata
    const metadata = await packager.getPackageMetadata(packagePath);
    assert.equal(metadata.name, 'metadata-test-app');
    assert.equal(metadata.version, '2.1.0');
    assert.equal(metadata.author, 'Metadata Author');
    assert.deepEqual(metadata.tags, ['utility', 'file-management']);
    assert.equal(metadata.license, 'MIT');
    assert(metadata.packagedAt, 'Should have packaging timestamp');
    assert(metadata.size > 0, 'Should have package size');
    
    console.log(`✅ Package metadata handling works correctly`);
  }));

  test('should support different packaging formats', integrationTest('packaging-formats', async (t, { createTestDir }) => {
    // Setup
    const projectsDir = await createTestDir('distribution-formats-projects');
    const packagesDir = await createTestDir('distribution-formats-packages');
    
    // Generate test project
    const generator = new ProjectGenerator({ outputDir: projectsDir });
    const projectPath = await generator.generateProject({
      name: 'format-test-app',
      template: 'minimal',
      author: 'Format Tester'
    });
    
    // Test different compression levels
    const packager = new AppPackager({ outputDir: packagesDir });
    
    // Package with different compression
    const normalPackage = await packager.packageApp(projectPath, {
      compression: 'normal'
    });
    
    const fastPackage = await packager.packageApp(projectPath, {
      compression: 'fast',
      outputName: 'format-test-app-fast'
    });
    
    // Verify both packages exist
    await assertFileExists(normalPackage, 'Normal compression package should exist');
    await assertFileExists(fastPackage, 'Fast compression package should exist');
    
    // Both should be installable
    const installer = new AppInstaller({ installDir: await createTestDir('format-install') });
    
    const normalInstall = await installer.installApp(normalPackage);
    const fastInstall = await installer.installApp(fastPackage);
    
    await assertFileExists(normalInstall, 'Normal package should install');
    await assertFileExists(fastInstall, 'Fast package should install');
    
    console.log(`✅ Different packaging formats work correctly`);
  }));

  test('should handle installation conflicts and overwrites', integrationTest('installation-conflicts', async (t, { createTestDir }) => {
    // Setup
    const projectsDir = await createTestDir('distribution-conflicts-projects');
    const packagesDir = await createTestDir('distribution-conflicts-packages');
    const installDir = await createTestDir('distribution-conflicts-install');
    
    // Create two versions of the same app
    const generator = new ProjectGenerator({ outputDir: projectsDir });
    
    const v1ProjectPath = await generator.generateProject({
      name: 'conflict-test-app',
      template: 'minimal',
      description: 'Version 1',
      author: 'Test Author'
    });
    
    // Modify for v2
    await fs.writeFile(
      path.join(v1ProjectPath, 'main.js'),
      'import { LahatAPI } from "@lahat/runtime";\nconsole.log("Version 2");'
    );
    
    // Package both versions
    const packager = new AppPackager({ outputDir: packagesDir });
    const v1Package = await packager.packageApp(v1ProjectPath, {
      outputName: 'conflict-test-app-v1'
    });
    const v2Package = await packager.packageApp(v1ProjectPath, {
      outputName: 'conflict-test-app-v2'
    });
    
    // Install v1
    const installer = new AppInstaller({ installDir });
    const v1Install = await installer.installApp(v1Package);
    
    // Verify v1 is installed
    await assertFileExists(v1Install, 'V1 should be installed');
    
    // Try to install v2 without overwrite (should fail or create different dir)
    try {
      const v2Install = await installer.installApp(v2Package, { overwrite: false });
      // If it doesn't throw, verify it created a different directory
      assert.notEqual(v1Install, v2Install, 'Should create different directory when not overwriting');
    } catch (error) {
      // Expected behavior - should fail without overwrite
      assert(error.message.includes('already exists') || error.message.includes('conflict'));
    }
    
    // Install v2 with overwrite
    const v2Install = await installer.installApp(v2Package, { overwrite: true });
    await assertFileExists(v2Install, 'V2 should be installed with overwrite');
    
    console.log(`✅ Installation conflict handling works correctly`);
  }));

  test('should validate package integrity', integrationTest('package-integrity', async (t, { createTestDir }) => {
    // Setup
    const projectsDir = await createTestDir('distribution-integrity-projects');
    const packagesDir = await createTestDir('distribution-integrity-packages');
    
    // Generate and package app
    const generator = new ProjectGenerator({ outputDir: projectsDir });
    const projectPath = await generator.generateProject({
      name: 'integrity-test-app',
      template: 'minimal',
      author: 'Integrity Tester'
    });
    
    const packager = new AppPackager({ outputDir: packagesDir });
    const packagePath = await packager.packageApp(projectPath);
    
    // Test package integrity
    const validator = new AppValidator();
    const integrityResult = await validator.validatePackage(packagePath);
    
    assert.equal(integrityResult.isValid, true, 'Valid package should pass integrity check');
    assert.equal(integrityResult.errors.length, 0, 'Valid package should have no integrity errors');
    
    // Test with corrupted package (simulate by truncating file)
    const corruptedPackagePath = path.join(packagesDir, 'corrupted.lahat');
    const originalContent = await fs.readFile(packagePath);
    const truncatedContent = originalContent.slice(0, originalContent.length / 2);
    await fs.writeFile(corruptedPackagePath, truncatedContent);
    
    try {
      const corruptedResult = await validator.validatePackage(corruptedPackagePath);
      assert.equal(corruptedResult.isValid, false, 'Corrupted package should fail validation');
    } catch (error) {
      // Expected - corrupted ZIP should throw error
      assert(error.message.includes('corrupt') || error.message.includes('invalid') || error.message.includes('unexpected'));
    }
    
    console.log(`✅ Package integrity validation works correctly`);
  }));

  test('should handle large app packages efficiently', integrationTest('large-packages', async (t, { createTestDir }) => {
    // Setup
    const projectsDir = await createTestDir('distribution-large-projects');
    const packagesDir = await createTestDir('distribution-large-packages');
    
    // Generate project
    const generator = new ProjectGenerator({ outputDir: projectsDir });
    const projectPath = await generator.generateProject({
      name: 'large-test-app',
      template: 'ui-focused',
      author: 'Large App Tester'
    });
    
    // Add some larger files to simulate a bigger app
    const assetsDir = path.join(projectPath, 'assets');
    await fs.mkdir(assetsDir, { recursive: true });
    
    // Create some mock asset files
    const largeContent = 'x'.repeat(50000); // 50KB file
    await fs.writeFile(path.join(assetsDir, 'large-asset-1.txt'), largeContent);
    await fs.writeFile(path.join(assetsDir, 'large-asset-2.txt'), largeContent);
    await fs.writeFile(path.join(assetsDir, 'large-asset-3.txt'), largeContent);
    
    // Package with timing
    const packager = new AppPackager({ outputDir: packagesDir });
    const startTime = Date.now();
    const packagePath = await packager.packageApp(projectPath);
    const packageTime = Date.now() - startTime;
    
    // Verify package was created
    await assertFileExists(packagePath, 'Large package should be created');
    
    // Package should be reasonable size
    const stats = await fs.stat(packagePath);
    assert(stats.size > 10000, 'Package should contain substantial content');
    assert(stats.size < 1000000, 'Package should be reasonably compressed'); // Should be much smaller than raw files
    
    // Installation should also be efficient
    const installer = new AppInstaller({ installDir: await createTestDir('large-install') });
    const installStartTime = Date.now();
    const installedPath = await installer.installApp(packagePath);
    const installTime = Date.now() - installStartTime;
    
    // Verify all files were installed
    await assertFileExists(installedPath, 'Large app should be installed');
    await assertFileExists(path.join(installedPath, 'assets', 'large-asset-1.txt'), 'Asset files should be installed');
    
    // Operations should complete in reasonable time (generous limits for CI)
    assert(packageTime < 10000, 'Packaging should complete within 10 seconds');
    assert(installTime < 10000, 'Installation should complete within 10 seconds');
    
    console.log(`✅ Large package handling works efficiently (package: ${packageTime}ms, install: ${installTime}ms)`);
  }));
});

describe('Distribution Manager Integration', () => {
  test('should coordinate packaging and installation workflow', integrationTest('distribution-workflow', async (t, { createTestDir }) => {
    // This test would use DistributionManager when it's available
    // For now, we'll test the coordination manually
    
    const projectsDir = await createTestDir('workflow-projects');
    const packagesDir = await createTestDir('workflow-packages');
    const installDir = await createTestDir('workflow-install');
    
    // Complete workflow: Generate -> Package -> Validate -> Install
    
    // 1. Generate
    const generator = new ProjectGenerator({ outputDir: projectsDir });
    const projectPath = await generator.generateProject({
      name: 'workflow-test-app',
      template: 'minimal',
      description: 'End-to-end workflow test',
      author: 'Workflow Tester'
    });
    
    // 2. Package
    const packager = new AppPackager({ outputDir: packagesDir });
    const packagePath = await packager.packageApp(projectPath);
    
    // 3. Validate
    const validator = new AppValidator();
    const validationResult = await validator.validatePackage(packagePath);
    assert.equal(validationResult.isValid, true, 'Package should be valid');
    
    // 4. Install
    const installer = new AppInstaller({ installDir });
    const installedPath = await installer.installApp(packagePath);
    
    // 5. Verify end-to-end result
    await assertFileExists(installedPath, 'App should be installed');
    
    // Count files to ensure nothing was lost
    const originalFileCount = await countFiles(projectPath, /\.(js|json|html|css|md)$/);
    const installedFileCount = await countFiles(installedPath, /\.(js|json|html|css|md)$/);
    
    assert.equal(installedFileCount, originalFileCount, 'All files should be preserved through workflow');
    
    console.log(`✅ Complete distribution workflow works correctly`);
  }));
});
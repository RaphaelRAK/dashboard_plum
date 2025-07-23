#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Analyzing bundle size and performance...\n');

// Function to format bytes
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Function to get file size
const getFileSize = (filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
};

// Function to analyze dist folder
const analyzeDist = () => {
  const distPath = path.join(process.cwd(), 'dist');
  
  if (!fs.existsSync(distPath)) {
    console.log('❌ Dist folder not found. Please run "npm run build" first.');
    return;
  }

  console.log('📁 Analyzing dist folder...\n');

  const files = [];
  
  const walkDir = (dir) => {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else {
        const relativePath = path.relative(distPath, fullPath);
        files.push({
          path: relativePath,
          size: stat.size,
          sizeFormatted: formatBytes(stat.size)
        });
      }
    });
  };

  walkDir(distPath);

  // Sort by size (largest first)
  files.sort((a, b) => b.size - a.size);

  console.log('📊 File sizes (largest first):\n');
  
  let totalSize = 0;
  files.forEach(file => {
    console.log(`${file.sizeFormatted.padEnd(10)} ${file.path}`);
    totalSize += file.size;
  });

  console.log(`\n📈 Total bundle size: ${formatBytes(totalSize)}`);
  
  // Analyze JS files specifically
  const jsFiles = files.filter(f => f.path.endsWith('.js'));
  const jsSize = jsFiles.reduce((sum, f) => sum + f.size, 0);
  console.log(`📦 JavaScript files: ${formatBytes(jsSize)} (${jsFiles.length} files)`);
  
  // Analyze CSS files
  const cssFiles = files.filter(f => f.path.endsWith('.css'));
  const cssSize = cssFiles.reduce((sum, f) => sum + f.size, 0);
  console.log(`🎨 CSS files: ${formatBytes(cssSize)} (${cssFiles.length} files)`);

  // Check for large dependencies
  console.log('\n🔍 Large files (>100KB):');
  files.filter(f => f.size > 100 * 1024).forEach(file => {
    console.log(`  ⚠️  ${file.path}: ${file.sizeFormatted}`);
  });

  return { totalSize, jsSize, cssSize, files };
};

// Function to check package.json for large dependencies
const analyzeDependencies = () => {
  console.log('\n📦 Analyzing dependencies...\n');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    // Known large packages
    const largePackages = [
      'antd', '@mui/material', 'plotly.js', 'leaflet', 'react-globe.gl',
      '@antv/g2', '@antv/g6', 'lodash', 'dayjs', 'react-plotly.js'
    ];
    
    console.log('📋 Large dependencies found:');
    largePackages.forEach(pkg => {
      if (allDeps[pkg]) {
        console.log(`  📦 ${pkg}: ${allDeps[pkg]}`);
      }
    });
    
    // Check for deprecated packages
    console.log('\n⚠️  Checking for deprecated packages...');
    try {
      const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
      const audit = JSON.parse(auditResult);
      
      if (audit.metadata && audit.metadata.vulnerabilities) {
        const vulns = audit.metadata.vulnerabilities;
        Object.keys(vulns).forEach(severity => {
          if (vulns[severity] > 0) {
            console.log(`  🔴 ${severity}: ${vulns[severity]} vulnerabilities`);
          }
        });
      }
    } catch (error) {
      console.log('  ℹ️  Could not run npm audit');
    }
    
  } catch (error) {
    console.log('❌ Could not read package.json');
  }
};

// Function to provide optimization recommendations
const provideRecommendations = (analysis) => {
  console.log('\n💡 Optimization Recommendations:\n');
  
  const { totalSize, jsSize } = analysis;
  
  if (totalSize > 5 * 1024 * 1024) { // 5MB
    console.log('🔴 Bundle is very large (>5MB). Consider:');
    console.log('  • Implementing code splitting');
    console.log('  • Removing unused dependencies');
    console.log('  • Using dynamic imports for heavy components');
  } else if (totalSize > 2 * 1024 * 1024) { // 2MB
    console.log('🟡 Bundle is large (>2MB). Consider:');
    console.log('  • Tree shaking unused code');
    console.log('  • Lazy loading non-critical components');
    console.log('  • Optimizing images and assets');
  } else {
    console.log('🟢 Bundle size is reasonable');
  }
  
  if (jsSize > 3 * 1024 * 1024) { // 3MB
    console.log('\n🔴 JavaScript bundle is very large. Consider:');
    console.log('  • Splitting vendor and app code');
    console.log('  • Using webpack-bundle-analyzer');
    console.log('  • Implementing route-based code splitting');
  }
  
  console.log('\n📋 General recommendations:');
  console.log('  • Enable gzip compression on server');
  console.log('  • Use CDN for large libraries');
  console.log('  • Implement service worker for caching');
  console.log('  • Optimize images (WebP format)');
  console.log('  • Minify CSS and JavaScript');
  console.log('  • Remove console.logs in production');
};

// Main execution
const main = () => {
  try {
    const analysis = analyzeDist();
    if (analysis) {
      analyzeDependencies();
      provideRecommendations(analysis);
    }
  } catch (error) {
    console.error('❌ Error during analysis:', error.message);
  }
};

main();
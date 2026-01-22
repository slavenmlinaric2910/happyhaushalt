import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

/**
 * Convert a PNG image to WebP format
 * @param {string} inputPath - Path to the PNG file
 * @param {string} outputPath - Path for the WebP output
 * @param {number} quality - WebP quality (1-100, default: 85)
 * @param {number|null} width - Target width in pixels (null to keep original)
 * @param {number|null} height - Target height in pixels (null to keep original)
 */
async function convertToWebP(inputPath, outputPath, quality = 85, width = null, height = null) {
  try {
    let pipeline = sharp(inputPath);
    
    // Resize to exact dimensions if provided
    if (width && height) {
      pipeline = pipeline.resize(width, height, { 
        kernel: sharp.kernel.lanczos3,
        fit: 'contain', // Maintain aspect ratio, fit within dimensions
        background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
      });
    }
    
    await pipeline
      .webp({ quality, effort: 6 })
      .toFile(outputPath);
    
    const inputStats = await stat(inputPath);
    const outputStats = await stat(outputPath);
    const savings = ((1 - outputStats.size / inputStats.size) * 100).toFixed(1);
    
    const sizeInfo = width && height ? ` (${width}x${height}px)` : '';
    console.log(`✓ ${basename(inputPath)} → ${basename(outputPath)}${sizeInfo} (${savings}% smaller)`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to convert ${inputPath}:`, error.message);
    return false;
  }
}

/**
 * Convert a PNG image to WebP at 2x resolution for retina displays
 * @param {string} inputPath - Path to the PNG file
 * @param {string} outputPath - Path for the 2x WebP output
 * @param {number} quality - WebP quality (1-100, default: 85)
 * @param {number|null} width - Target 1x width in pixels (null to use original * 2)
 * @param {number|null} height - Target 1x height in pixels (null to use original * 2)
 */
async function convertToWebP2x(inputPath, outputPath, quality = 85, width = null, height = null) {
  try {
    let pipeline = sharp(inputPath);
    
    if (width && height) {
      // Resize to 2x dimensions (double the 1x size)
      const width2x = width * 2;
      const height2x = height * 2;
      pipeline = pipeline.resize(width2x, height2x, { 
        kernel: sharp.kernel.lanczos3,
        fit: 'contain', // Maintain aspect ratio, fit within dimensions
        background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
      });
    } else {
      // Fallback: use original dimensions * 2
      const metadata = await sharp(inputPath).metadata();
      pipeline = pipeline.resize(metadata.width * 2, metadata.height * 2, { 
        kernel: sharp.kernel.lanczos3,
        background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
      });
    }
    
    await pipeline
      .webp({ quality, effort: 6 })
      .toFile(outputPath);
    
    const sizeInfo = width && height ? ` (${width * 2}x${height * 2}px)` : '';
    console.log(`✓ ${basename(inputPath)} → ${basename(outputPath)}${sizeInfo} (2x for retina)`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to convert ${inputPath} to 2x:`, error.message);
    return false;
  }
}

/**
 * Process all PNG files in a directory
 * @param {string} dirPath - Directory path to process
 * @param {boolean} create2x - Whether to create 2x versions
 * @param {number|null} targetWidth - Target width for 1x images (null to keep original)
 * @param {number|null} targetHeight - Target height for 1x images (null to keep original)
 */
async function processDirectory(dirPath, create2x = false, targetWidth = null, targetHeight = null) {
  try {
    const files = await readdir(dirPath);
    const pngFiles = files.filter(file => file.toLowerCase().endsWith('.png'));
    
    if (pngFiles.length === 0) {
      console.log(`No PNG files found in ${dirPath}`);
      return;
    }
    
    const sizeInfo = targetWidth && targetHeight ? ` at ${targetWidth}x${targetHeight}px` : '';
    console.log(`\nProcessing ${pngFiles.length} file(s) in ${basename(dirPath)}${sizeInfo}...`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const file of pngFiles) {
      const inputPath = join(dirPath, file);
      const baseName = basename(file, extname(file));
      const outputPath = join(dirPath, `${baseName}.webp`);
      
      const success = await convertToWebP(inputPath, outputPath, 85, targetWidth, targetHeight);
      if (success) {
        successCount++;
        
        // Create 2x version if requested
        if (create2x) {
          const outputPath2x = join(dirPath, `${baseName}@2x.webp`);
          await convertToWebP2x(inputPath, outputPath2x, 85, targetWidth, targetHeight);
        }
      } else {
        failCount++;
      }
    }
    
    console.log(`\nCompleted: ${successCount} succeeded, ${failCount} failed`);
  } catch (error) {
    console.error(`Error processing directory ${dirPath}:`, error.message);
  }
}

/**
 * Main function
 * 
 * Image dimension requirements:
 * - Avatars: Displayed at 230x230px, so generate 230x230px (1x) and 460x460px (2x)
 * - House illustrations: Displayed at 380x380px, so generate 380x380px (1x) and 760x760px (2x)
 */
async function main() {
  console.log('🖼️  Converting PNG images to WebP format at exact display dimensions...\n');
  
  const avatarsDir = join(projectRoot, 'public', 'avatars');
  const illustrationsDir = join(projectRoot, 'public', 'illustrations');
  
  // Process avatars: 230x230px (1x), 460x460px (2x)
  // These dimensions match the CSS: .memberAvatar { width: 230px; height: 230px; }
  await processDirectory(avatarsDir, true, 230, 230);
  
  // Process illustrations: 380x380px (1x), 760x760px (2x)
  // House decoration is displayed at 380x380px per CSS
  // Special handling for house illustrations
  const files = await readdir(illustrationsDir);
  const pngFiles = files.filter(file => file.toLowerCase().endsWith('.png'));
  
  console.log(`\nProcessing ${pngFiles.length} illustration file(s) in ${basename(illustrationsDir)}...`);
  let successCount = 0;
  let failCount = 0;
  
  for (const file of pngFiles) {
    const inputPath = join(illustrationsDir, file);
    const baseName = basename(file, extname(file));
    const outputPath = join(illustrationsDir, `${baseName}.webp`);
    
    // House illustrations: 380x380px (1x), 760x760px (2x)
    // Other illustrations: keep original size for now
    const isHouseIllustration = baseName.includes('house');
    const width = isHouseIllustration ? 380 : null;
    const height = isHouseIllustration ? 380 : null;
    
    const success = await convertToWebP(inputPath, outputPath, 85, width, height);
    if (success) {
      successCount++;
      // Create 2x version
      const outputPath2x = join(illustrationsDir, `${baseName}@2x.webp`);
      await convertToWebP2x(inputPath, outputPath2x, 85, width, height);
    } else {
      failCount++;
    }
  }
  
  console.log(`\nIllustrations completed: ${successCount} succeeded, ${failCount} failed`);
  
  console.log('\n✨ Conversion complete!');
  console.log('\nNote: The code already has fallback to PNG, so existing PNG files will still work.');
  console.log('Generated images are sized to exact display dimensions to optimize bandwidth.');
}

main().catch(console.error);


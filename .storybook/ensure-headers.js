import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORYBOOK_OUTPUT_DIR = path.resolve(__dirname, '../storybook-static');
const SERVICE_WORKER_FILE = path.resolve(__dirname, '../public/coi-serviceworker.js');
const REGISTER_SW_FILE = path.resolve(__dirname, '../public/register-coi-sw.js');
const COI_CHECK_FILE = path.resolve(__dirname, '../public/coi-check.html');

// HTML template to inject service worker registration
const SW_REGISTRATION_SCRIPT = `
<!-- Cross-origin isolation service worker -->
<script src="register-coi-sw.js"></script>
`;

/**
 * Recursively search for all HTML files in a directory
 */
async function findHtmlFiles(dir) {
  const files = await readdir(dir);
  const htmlFiles = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const fileStat = await stat(filePath);
    
    if (fileStat.isDirectory()) {
      const nestedHtmlFiles = await findHtmlFiles(filePath);
      htmlFiles.push(...nestedHtmlFiles);
    } else if (path.extname(file).toLowerCase() === '.html') {
      htmlFiles.push(filePath);
    }
  }

  return htmlFiles;
}

/**
 * Inject service worker registration script into HTML file
 */
async function injectServiceWorkerRegistration(htmlFilePath) {
  let content = await readFile(htmlFilePath, 'utf8');
  
  // Check if service worker registration is already injected
  if (content.includes('register-coi-sw.js')) {
    console.log(`Service worker already registered in ${htmlFilePath}`);
    return;
  }

  // Inject before closing head tag
  content = content.replace('</head>', `${SW_REGISTRATION_SCRIPT}</head>`);
  
  await writeFile(htmlFilePath, content, 'utf8');
  console.log(`Injected service worker registration into ${htmlFilePath}`);
}

/**
 * Copy file from source to destination
 */
async function copyFile(source, destination) {
  try {
    if (!fs.existsSync(source)) {
      console.error(`Source file not found: ${source}`);
      await createFallbackFile(destination);
      return;
    }
    
    const content = await readFile(source, 'utf8');
    await writeFile(destination, content, 'utf8');
    console.log(`Copied ${path.basename(source)} to ${destination}`);
  } catch (error) {
    console.error(`Error copying file: ${error.message}`);
    await createFallbackFile(destination);
  }
}

/**
 * Create a fallback file if source doesn't exist
 */
async function createFallbackFile(destination) {
  const filename = path.basename(destination);
  
  if (filename === 'coi-serviceworker.js') {
    // Minimal service worker for cross-origin isolation
    const content = `
// This is a minimal service worker for cross-origin isolation
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const requestUrl = new URL(e.request.url);
  if (requestUrl.origin === self.location.origin) {
    e.respondWith(
      fetch(e.request)
        .then(response => {
          const newHeaders = new Headers(response.headers);
          newHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');
          newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');
          
          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders,
          });
        })
    );
  } else {
    e.respondWith(fetch(e.request));
  }
});
`;
    await writeFile(destination, content, 'utf8');
    console.log(`Created fallback service worker at ${destination}`);
  } else if (filename === 'register-coi-sw.js') {
    // Script to register the service worker
    const content = `
// Register the service worker for cross-origin isolation
(function() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./coi-serviceworker.js')
      .then(() => console.log('COI ServiceWorker registered'))
      .catch(err => console.error('COI ServiceWorker registration failed', err));
  } else {
    console.warn('Service workers are not supported in this browser');
  }
})();
`;
    await writeFile(destination, content, 'utf8');
    console.log(`Created fallback registration script at ${destination}`);
  } else if (filename === 'coi-check.html') {
    // Diagnostic page
    const content = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cross-Origin Isolation Check</title>
    <script src="register-coi-sw.js"></script>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .status { padding: 10px; border-radius: 4px; margin-bottom: 10px; }
        .success { background-color: #d4edda; color: #155724; }
        .warning { background-color: #fff3cd; color: #856404; }
        .error { background-color: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <h1>Cross-Origin Isolation Status</h1>
    <div id="coi-status" class="status"></div>
    <div id="sab-status" class="status"></div>
    <div id="sw-status" class="status"></div>
    
    <h2>Technical Details</h2>
    <pre id="details"></pre>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const coiStatus = document.getElementById('coi-status');
            const sabStatus = document.getElementById('sab-status');
            const swStatus = document.getElementById('sw-status');
            const details = document.getElementById('details');
            
            // Check cross-origin isolation
            const isCrossOriginIsolated = window.crossOriginIsolated;
            coiStatus.textContent = isCrossOriginIsolated 
                ? '✅ Cross-Origin Isolation is enabled' 
                : '❌ Cross-Origin Isolation is NOT enabled';
            coiStatus.className = 'status ' + (isCrossOriginIsolated ? 'success' : 'error');
            
            // Check SharedArrayBuffer support
            const isSharedArrayBufferAvailable = typeof SharedArrayBuffer === 'function';
            sabStatus.textContent = isSharedArrayBufferAvailable 
                ? '✅ SharedArrayBuffer is available' 
                : '❌ SharedArrayBuffer is NOT available';
            sabStatus.className = 'status ' + (isSharedArrayBufferAvailable ? 'success' : 'error');
            
            // Check service worker registration
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistration('./coi-serviceworker.js')
                    .then(registration => {
                        if (registration) {
                            swStatus.textContent = '✅ COI Service Worker is registered';
                            swStatus.className = 'status success';
                        } else {
                            swStatus.textContent = '⚠️ COI Service Worker is not registered yet';
                            swStatus.className = 'status warning';
                        }
                    })
                    .catch(error => {
                        swStatus.textContent = '❌ Error checking service worker: ' + error.message;
                        swStatus.className = 'status error';
                    });
            } else {
                swStatus.textContent = '❌ Service Workers are not supported in this browser';
                swStatus.className = 'status error';
            }
            
            // Display technical details
            details.textContent = JSON.stringify({
                crossOriginIsolated: isCrossOriginIsolated,
                sharedArrayBufferAvailable: isSharedArrayBufferAvailable,
                serviceWorkerSupported: 'serviceWorker' in navigator,
                headers: {
                    'Cross-Origin-Embedder-Policy': 'require-corp',
                    'Cross-Origin-Opener-Policy': 'same-origin'
                },
                userAgent: navigator.userAgent
            }, null, 2);
        });
    </script>
</body>
</html>
`;
    await writeFile(destination, content, 'utf8');
    console.log(`Created diagnostic page at ${destination}`);
  }
}

/**
 * Main function to process Storybook output
 */
async function main() {
  try {
    console.log('Ensuring cross-origin isolation for Storybook deployment...');
    
    // Check if Storybook output directory exists
    if (!fs.existsSync(STORYBOOK_OUTPUT_DIR)) {
      console.error(`Storybook output directory not found: ${STORYBOOK_OUTPUT_DIR}`);
      process.exit(1);
    }

    // Create public directory in Storybook output if it doesn't exist
    const publicDir = path.join(STORYBOOK_OUTPUT_DIR, 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    // Copy or create service worker files
    await copyFile(
      SERVICE_WORKER_FILE, 
      path.join(STORYBOOK_OUTPUT_DIR, 'coi-serviceworker.js')
    );
    
    await copyFile(
      REGISTER_SW_FILE, 
      path.join(STORYBOOK_OUTPUT_DIR, 'register-coi-sw.js')
    );
    
    await copyFile(
      COI_CHECK_FILE, 
      path.join(STORYBOOK_OUTPUT_DIR, 'coi-check.html')
    );
    
    // Find all HTML files and inject service worker registration
    const htmlFiles = await findHtmlFiles(STORYBOOK_OUTPUT_DIR);
    console.log(`Found ${htmlFiles.length} HTML files`);
    
    for (const htmlFile of htmlFiles) {
      await injectServiceWorkerRegistration(htmlFile);
    }
    
    console.log('Cross-origin isolation setup completed successfully!');
  } catch (error) {
    console.error('Error ensuring cross-origin isolation:', error);
    process.exit(1);
  }
}

main(); 
#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

// Color codes for better output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, emoji) {
  log(`\n${emoji} ${step}`, "cyan");
}

function logError(message) {
  log(`❌ Error: ${message}`, "red");
}

function logSuccess(message) {
  log(`✅ ${message}`, "green");
}

function runCommand(command, description = "") {
  try {
    if (description) {
      log(`   → ${description}`, "blue");
    }
    execSync(command, { stdio: "inherit" });
    return true;
  } catch (error) {
    logError(`Command failed: ${command}`);
    if (error.message) {
      logError(error.message);
    }
    return false;
  }
}

function checkFileExists(filePath, description) {
  if (!fs.existsSync(filePath)) {
    logError(`${description} not found: ${filePath}`);
    return false;
  }
  return true;
}

function checkDirectoryExists(dirPath, description) {
  if (!fs.existsSync(dirPath)) {
    logError(`${description} not found: ${dirPath}`);
    return false;
  }
  return true;
}

// Validate arguments
if (process.argv.length < 4) {
  logError("Usage: node setup-site.js <project_path> <domain>");
  log(
    "\nExample: node setup-site.js /home/user/projects/myapp myapp.local",
    "yellow"
  );
  process.exit(1);
}

const projectPath = path.resolve(process.argv[2]);
const domain = process.argv[3];

// Validate domain format
if (!/^[a-z0-9.-]+$/i.test(domain)) {
  logError(
    "Invalid domain format. Domain should only contain letters, numbers, dots, and hyphens."
  );
  process.exit(1);
}

log(`\n🚀 Setting up Laravel site: ${domain}`, "cyan");
log(`   Project path: ${projectPath}\n`);

// Validate project path
if (!checkDirectoryExists(projectPath, "Project directory")) {
  process.exit(1);
}

const publicPath = path.join(projectPath, "public");
if (!checkDirectoryExists(publicPath, "Public directory")) {
  logError("Laravel project must have a 'public' directory.");
  process.exit(1);
}

// Configuration paths
const sslDir = `/etc/ssl/${domain}`;
const nginxAvailable = `/etc/nginx/sites-available/${domain}`;
const nginxEnabled = `/etc/nginx/sites-enabled/${domain}`;

// Windows paths (adjust username if needed)
const winBase = "/mnt/c/Users/prati/Desktop";
const winCert = path.join(winBase, `${domain}.pem`);
const winKey = path.join(winBase, `${domain}-key.pem`);

// ---- STEP 1: Create SSL folder and copy from Windows ----
logStep("Setting up SSL certificates", "🔒");

// Check if SSL files exist on Windows Desktop
if (
  !checkFileExists(winCert, "SSL certificate file") ||
  !checkFileExists(winKey, "SSL key file")
) {
  logError(`SSL files not found on Windows Desktop for ${domain}`);
  log(`Expected files:`, "yellow");
  log(`  - ${winCert}`, "yellow");
  log(`  - ${winKey}`, "yellow");
  process.exit(1);
}

if (!runCommand(`sudo mkdir -p ${sslDir}`, "Creating SSL directory")) {
  process.exit(1);
}

if (
  !runCommand(
    `sudo cp "${winCert}" "${sslDir}/${domain}.crt"`,
    "Copying certificate"
  )
) {
  process.exit(1);
}

if (
  !runCommand(
    `sudo cp "${winKey}" "${sslDir}/${domain}.key"`,
    "Copying private key"
  )
) {
  process.exit(1);
}

// Set proper permissions
runCommand(
  `sudo chmod 644 ${sslDir}/${domain}.crt`,
  "Setting certificate permissions"
);
runCommand(`sudo chmod 600 ${sslDir}/${domain}.key`, "Setting key permissions");

logSuccess("SSL certificates copied successfully");

// ---- STEP 2: Create Nginx config ----
logStep("Creating Nginx configuration", "⚙️");

// Detect PHP version (try common versions)
const phpVersions = ["8.3", "8.2", "8.1", "8.0"];
let phpVersion = "8.2"; // default
let phpSocket = `/var/run/php/php${phpVersion}-fpm.sock`;

// Try to detect PHP version
for (const version of phpVersions) {
  const testSocket = `/var/run/php/php${version}-fpm.sock`;
  if (fs.existsSync(testSocket)) {
    phpVersion = version;
    phpSocket = testSocket;
    break;
  }
}

log(`   → Using PHP ${phpVersion} (${phpSocket})`, "blue");

const nginxConfig = `server {
    listen 80;
    listen [::]:80;
    server_name ${domain};
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${domain};

    # SSL Configuration
    ssl_certificate ${sslDir}/${domain}.crt;
    ssl_certificate_key ${sslDir}/${domain}.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Laravel public path
    root ${projectPath}/public;
    index index.php index.html index.htm;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/${domain}-access.log;
    error_log /var/log/nginx/${domain}-error.log;

    # Laravel front controller
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # PHP-FPM
    location ~ \\.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:${phpSocket};
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
        
        # Increase timeouts for large requests
        fastcgi_read_timeout 300;
        fastcgi_send_timeout 300;
    }

    # Hide .ht* files
    location ~ /\\.ht {
        deny all;
    }

    # Deny access to hidden files
    location ~ /\\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
`;

const tempConfigFile = `/tmp/${domain}.conf`;
try {
  fs.writeFileSync(tempConfigFile, nginxConfig);
  log(`   → Configuration written to temporary file`, "blue");
} catch (error) {
  logError(`Failed to write temporary config file: ${error.message}`);
  process.exit(1);
}

if (
  !runCommand(
    `sudo mv ${tempConfigFile} ${nginxAvailable}`,
    "Moving config to sites-available"
  )
) {
  process.exit(1);
}

// Enable site if not already enabled
if (!fs.existsSync(nginxEnabled)) {
  if (
    !runCommand(`sudo ln -s ${nginxAvailable} ${nginxEnabled}`, "Enabling site")
  ) {
    process.exit(1);
  }
} else {
  log(`   → Site already enabled`, "yellow");
}

logSuccess("Nginx configuration created");

// ---- STEP 3: Add host entry in Windows hosts ----
logStep("Updating Windows hosts file", "🧠");

const winHosts = "/mnt/c/Windows/System32/drivers/etc/hosts";

if (!checkFileExists(winHosts, "Windows hosts file")) {
  logError("Windows hosts file not found. Make sure you're running in WSL.");
  process.exit(1);
}

try {
  let hostsContent = fs.readFileSync(winHosts, "utf8");
  const hostsEntry = `127.0.0.1 ${domain}`;

  if (hostsContent.includes(`${domain}`)) {
    log(`   → Hosts entry already exists for ${domain}`, "yellow");
  } else {
    hostsContent += `\n${hostsEntry}\n`;
    fs.writeFileSync(winHosts, hostsContent, "utf8");
    logSuccess("Hosts file updated");
  }
} catch (error) {
  logError(`Failed to update hosts file: ${error.message}`);
  log(
    "You may need to run this script with sudo or edit the hosts file manually.",
    "yellow"
  );
}

// ---- STEP 4: Fix permissions ----
logStep("Setting Laravel permissions", "🔧");

const storagePath = path.join(projectPath, "storage");
const cachePath = path.join(projectPath, "bootstrap", "cache");

if (!fs.existsSync(storagePath)) {
  logError(`Storage directory not found: ${storagePath}`);
  process.exit(1);
}

if (!fs.existsSync(cachePath)) {
  logError(`Cache directory not found: ${cachePath}`);
  process.exit(1);
}

if (
  !runCommand(
    `sudo chown -R www-data:www-data ${storagePath} ${cachePath}`,
    "Setting ownership"
  )
) {
  process.exit(1);
}

if (
  !runCommand(
    `sudo chmod -R 775 ${storagePath} ${cachePath}`,
    "Setting permissions"
  )
) {
  process.exit(1);
}

logSuccess("Laravel permissions set");

// ---- STEP 5: Test and Reload Nginx ----
logStep("Testing and reloading Nginx", "🚀");

if (!runCommand("sudo nginx -t", "Testing Nginx configuration")) {
  logError("Nginx configuration test failed. Please fix the errors above.");
  process.exit(1);
}

if (!runCommand("sudo systemctl reload nginx", "Reloading Nginx")) {
  logError("Failed to reload Nginx. You may need to restart it manually.");
  process.exit(1);
}

logSuccess("Nginx reloaded successfully");

// ---- Success message ----
log("\n" + "=".repeat(60), "green");
logSuccess(`Site setup complete for ${domain}!`);
log("\nYou can now visit:", "cyan");
log(`  🌐 http://${domain} (redirects to HTTPS)`, "yellow");
log(`  🔒 https://${domain}`, "yellow");
log("\n" + "=".repeat(60) + "\n", "green");

process.exit(0);

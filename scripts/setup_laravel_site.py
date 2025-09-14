#!/usr/bin/env python3
"""
Laravel Site Setup Script
Creates SSL certificates, configures Nginx, and sets up Laravel project
"""

import os
import sys
import json
import subprocess
import time
import sqlite3
from pathlib import Path
import re

class LaravelSiteSetup:
    def __init__(self, site_name, site_path, certificate_path, site_id):
        self.site_name = self.sanitize_site_name(site_name)
        self.site_path = site_path
        self.certificate_path = certificate_path
        self.site_id = site_id
        self.db_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'app.db')
        
    def sanitize_site_name(self, name):
        """Remove spaces and capital letters, replace spaces with dashes"""
        # Convert to lowercase
        name = name.lower()
        # Replace spaces with dashes
        name = re.sub(r'\s+', '-', name)
        # Remove any special characters except dashes
        name = re.sub(r'[^a-z0-9-]', '', name)
        # Remove multiple consecutive dashes
        name = re.sub(r'-+', '-', name)
        # Remove leading/trailing dashes
        name = name.strip('-')
        return name
    
    def log_step(self, step, status, message=""):
        """Log step progress to database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO setup_logs (site_id, step, status, message) 
                VALUES (?, ?, ?, ?)
            """, (self.site_id, step, status, message))
            conn.commit()
            conn.close()
            print(f"[{status.upper()}] {step}: {message}")
        except Exception as e:
            print(f"Error logging step: {e}")
    
    def run_command(self, command, shell=True, cwd=None):
        """Run a command and return success status"""
        try:
            result = subprocess.run(
                command, 
                shell=shell, 
                cwd=cwd,
                capture_output=True, 
                text=True,
                timeout=300  # 5 minute timeout
            )
            return result.returncode == 0, result.stdout, result.stderr
        except subprocess.TimeoutExpired:
            return False, "", "Command timed out"
        except Exception as e:
            return False, "", str(e)
    
    def step1_create_ssl_certificate(self):
        """Step 1: Create SSL certificate using mkcert"""
        self.log_step("SSL Certificate Creation", "in_progress", "Starting SSL certificate creation...")
        
        # Change to certificate directory
        os.chdir(self.certificate_path)
        
        # Run mkcert command
        command = f"mkcert {self.site_name}.test"
        success, stdout, stderr = self.run_command(command)
        
        if success:
            self.log_step("SSL Certificate Creation", "completed", f"SSL certificate created successfully for {self.site_name}.test")
            return True
        else:
            self.log_step("SSL Certificate Creation", "failed", f"Failed to create SSL certificate: {stderr}")
            return False
    
    def step2_copy_certificates_to_wsl(self):
        """Step 2: Copy certificates to WSL and set permissions"""
        self.log_step("WSL Certificate Setup", "in_progress", "Copying certificates to WSL...")
        
        # Create SSL directory in WSL
        ssl_dir = f"/etc/ssl/{self.site_name}"
        mkdir_command = f"wsl mkdir -p {ssl_dir}"
        success, _, stderr = self.run_command(mkdir_command)
        
        if not success:
            self.log_step("WSL Certificate Setup", "failed", f"Failed to create SSL directory: {stderr}")
            return False
        
        # Convert Windows path to WSL path
        wsl_cert_path = f"/mnt/{self.certificate_path.replace(':', '').replace('\\', '/').lower()}"
        
        # Copy certificate files
        cert_file = f"{self.site_name}.test.pem"
        key_file = f"{self.site_name}.test-key.pem"
        
        # Copy certificate
        copy_cert_cmd = f"cp {wsl_cert_path}/{cert_file} {ssl_dir}/{self.site_name}.test.crt"
        success, _, stderr = self.run_command(copy_cert_cmd)
        
        if not success:
            self.log_step("WSL Certificate Setup", "failed", f"Failed to copy certificate: {stderr}")
            return False
        
        # Copy private key
        copy_key_cmd = f"cp {wsl_cert_path}/{key_file} {ssl_dir}/{self.site_name}.test.key"
        success, _, stderr = self.run_command(copy_key_cmd)
        
        if not success:
            self.log_step("WSL Certificate Setup", "failed", f"Failed to copy private key: {stderr}")
            return False
        
        # Set permissions
        chmod_cert_cmd = f"chmod 644 {ssl_dir}/{self.site_name}.test.crt"
        chmod_key_cmd = f"chmod 600 {ssl_dir}/{self.site_name}.test.key"
        
        self.run_command(chmod_cert_cmd)
        self.run_command(chmod_key_cmd)
        
        self.log_step("WSL Certificate Setup", "completed", "Certificates copied and permissions set")
        return True
    
    def step3_create_nginx_config(self):
        """Step 3: Create Nginx configuration file"""
        self.log_step("Nginx Configuration", "in_progress", "Creating Nginx configuration...")
        
        nginx_config = f"""server {{
    listen 80;
    listen [::]:80;
    server_name {self.site_name}.test;
    return 301 https://$host$request_uri;
}}

server {{
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name {self.site_name}.test;

    # SSL
    ssl_certificate     /etc/ssl/{self.site_name}/{self.site_name}.test.crt;
    ssl_certificate_key /etc/ssl/{self.site_name}/{self.site_name}.test.key;

    # Laravel public path
    root {self.site_path}/public;
    index index.php index.html;

    # Security headers (basic)
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Laravel front controller
    location / {{
        try_files $uri $uri/ /index.php?$query_string;
    }}

    # PHP-FPM
    location ~ \\.php$ {{
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock; # adjust if different
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }}

    # Hide .ht* files
    location ~ /\\.ht {{
        deny all;
    }}
}}"""
        
        # Create temporary file
        temp_file = f"/tmp/{self.site_name}.test"
        with open(temp_file, 'w') as f:
            f.write(nginx_config)
        
        # Copy to WSL
        copy_config_cmd = f"cp {temp_file} /etc/nginx/sites-available/{self.site_name}.test"
        success, _, stderr = self.run_command(copy_config_cmd)
        
        # Clean up temp file
        os.remove(temp_file)
        
        if not success:
            self.log_step("Nginx Configuration", "failed", f"Failed to create Nginx config: {stderr}")
            return False
        
        self.log_step("Nginx Configuration", "completed", "Nginx configuration created")
        return True
    
    def step4_enable_nginx_site(self):
        """Step 4: Enable Nginx site and reload"""
        self.log_step("Nginx Site Enable", "in_progress", "Enabling Nginx site...")
        
        # Create symlink
        symlink_cmd = f"ln -sf /etc/nginx/sites-available/{self.site_name}.test /etc/nginx/sites-enabled/{self.site_name}.test"
        success, _, stderr = self.run_command(symlink_cmd)
        
        if not success:
            self.log_step("Nginx Site Enable", "failed", f"Failed to create symlink: {stderr}")
            return False
        
        # Test and reload Nginx
        test_cmd = "nginx -t"
        success, _, stderr = self.run_command(test_cmd)
        
        if not success:
            self.log_step("Nginx Site Enable", "failed", f"Nginx configuration test failed: {stderr}")
            return False
        
        reload_cmd = "systemctl reload nginx"
        success, _, stderr = self.run_command(reload_cmd)
        
        if not success:
            self.log_step("Nginx Site Enable", "failed", f"Failed to reload Nginx: {stderr}")
            return False
        
        self.log_step("Nginx Site Enable", "completed", "Nginx site enabled and reloaded")
        return True
    
    def step5_update_hosts_file(self):
        """Step 5: Update Windows hosts file"""
        self.log_step("Hosts File Update", "in_progress", "Updating Windows hosts file...")
        
        hosts_file = "/mnt/c/Windows/System32/drivers/etc/hosts"
        hosts_entry = f"127.0.0.1 {self.site_name}.test"
        
        try:
            # Read current hosts file
            with open(hosts_file, 'r') as f:
                content = f.read()
            
            # Check if entry already exists
            if hosts_entry in content:
                self.log_step("Hosts File Update", "completed", "Hosts entry already exists")
                return True
            
            # Add entry
            with open(hosts_file, 'a') as f:
                f.write(f"\n{hosts_entry}\n")
            
            self.log_step("Hosts File Update", "completed", "Hosts file updated successfully")
            return True
            
        except Exception as e:
            self.log_step("Hosts File Update", "failed", f"Failed to update hosts file: {str(e)}")
            return False
    
    def step6_set_laravel_permissions(self):
        """Step 6: Set Laravel directory permissions"""
        self.log_step("Laravel Permissions", "in_progress", "Setting Laravel directory permissions...")
        
        # Change ownership
        chown_cmd = f"chown -R $USER:www-data {self.site_path}/storage {self.site_path}/bootstrap/cache"
        success, _, stderr = self.run_command(chown_cmd)
        
        if not success:
            self.log_step("Laravel Permissions", "failed", f"Failed to change ownership: {stderr}")
            return False
        
        # Set permissions
        chmod_cmd = f"chmod -R 775 {self.site_path}/storage {self.site_path}/bootstrap/cache"
        success, _, stderr = self.run_command(chmod_cmd)
        
        if not success:
            self.log_step("Laravel Permissions", "failed", f"Failed to set permissions: {stderr}")
            return False
        
        self.log_step("Laravel Permissions", "completed", "Laravel permissions set successfully")
        return True
    
    def update_site_status(self, status):
        """Update site status in database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE sites 
                SET status = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            """, (status, self.site_id))
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Error updating site status: {e}")
    
    def run_setup(self):
        """Run the complete setup process"""
        print(f"Starting Laravel site setup for {self.site_name}.test")
        
        try:
            # Step 1: Create SSL certificate
            if not self.step1_create_ssl_certificate():
                self.update_site_status("Failed")
                return False
            
            # Step 2: Copy certificates to WSL
            if not self.step2_copy_certificates_to_wsl():
                self.update_site_status("Failed")
                return False
            
            # Step 3: Create Nginx configuration
            if not self.step3_create_nginx_config():
                self.update_site_status("Failed")
                return False
            
            # Step 4: Enable Nginx site
            if not self.step4_enable_nginx_site():
                self.update_site_status("Failed")
                return False
            
            # Step 5: Update hosts file
            if not self.step5_update_hosts_file():
                self.update_site_status("Failed")
                return False
            
            # Step 6: Set Laravel permissions
            if not self.step6_set_laravel_permissions():
                self.update_site_status("Failed")
                return False
            
            # All steps completed successfully
            self.update_site_status("Active")
            self.log_step("Setup Complete", "completed", f"Laravel site {self.site_name}.test is now active!")
            print(f"Setup completed successfully for {self.site_name}.test")
            return True
            
        except Exception as e:
            self.log_step("Setup Error", "failed", f"Unexpected error: {str(e)}")
            self.update_site_status("Failed")
            print(f"Setup failed with error: {e}")
            return False

def main():
    if len(sys.argv) != 5:
        print("Usage: python setup_laravel_site.py <site_name> <site_path> <certificate_path> <site_id>")
        sys.exit(1)
    
    site_name = sys.argv[1]
    site_path = sys.argv[2]
    certificate_path = sys.argv[3]
    site_id = int(sys.argv[4])
    
    setup = LaravelSiteSetup(site_name, site_path, certificate_path, site_id)
    success = setup.run_setup()
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()

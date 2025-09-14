# Laravel Local Hosting Setup Tool

A comprehensive Next.js application that automates the setup of Laravel projects for local development with SSL certificates, Nginx configuration, and real-time progress tracking.

## 🚀 Features

- **Multi-Step Setup Form**: Guided configuration for Laravel project setup
- **SSL Certificate Management**: Automatic certificate generation using `mkcert`
- **Nginx Configuration**: Automated Nginx setup with SSL and Laravel support
- **Real-Time Progress Tracking**: Live logging and status updates during setup
- **WSL Compatibility**: Full support for Windows Subsystem for Linux
- **Database Integration**: SQLite database for site and log management
- **Beautiful UI**: Modern interface with FontAwesome icons and animations
- **Auto-Redirect**: Success page with countdown and automatic navigation

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, SQLite (better-sqlite3)
- **Scripting**: Python 3 for system operations
- **Database**: SQLite with custom database utilities
- **Icons**: FontAwesome 6 (CSS-based)

## 📋 Prerequisites

- Node.js 18+ and npm
- Python 3.7+
- WSL (Windows Subsystem for Linux)
- Nginx installed in WSL
- `mkcert` installed on Windows
- Laravel project directory

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd laravel-local-hosting-nextjs
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment

1. Install `mkcert` on Windows:

   ```bash
   # Using Chocolatey
   choco install mkcert
   
   # Or download from GitHub releases
   # https://github.com/FiloSottile/mkcert/releases
   ```

2. Install Nginx in WSL:

   ```bash
   sudo apt update
   sudo apt install nginx
   sudo systemctl start nginx
   sudo systemctl enable nginx
   ```

### 4. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.

## 📖 Usage

### 1. Initial Setup

- Configure your Windows certificate path
- Set up your WSL directory path for Laravel projects

### 2. Create a New Site

1. Click "Create New Site" on the dashboard
2. Fill in the project name and WSL directory path
3. Click "Start Setup" to begin the automated process

### 3. Monitor Progress

- Real-time logging shows each setup step
- Progress bar indicates completion status
- Automatic redirect to success page when complete

## 🔧 Configuration

### Database Schema

#### Sites Table

- `id`: Primary key
- `site_name`: Project name with .test suffix
- `site_path`: WSL directory path
- `status`: In Progress, Active, or Failed
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

#### Setup Logs Table

- `id`: Primary key
- `site_id`: Foreign key to sites table
- `step`: Setup step name
- `status`: pending, in_progress, completed, or failed
- `message`: Step description or error message
- `created_at`: Log timestamp

### Python Setup Script

The `scripts/setup_laravel_site.py` script handles:

1. SSL certificate generation
2. WSL certificate setup
3. Nginx configuration
4. Site activation
5. Hosts file update
6. Laravel permissions setup

## 🎨 UI Components

- **LandingPage**: Welcome screen with feature highlights
- **MultiStepForm**: Guided setup form with conditional steps
- **SetupLogger**: Real-time progress tracking interface
- **SetupSuccess**: Completion page with countdown and site info

## 🔒 Security Features

- SSL certificate generation for local development
- Proper file permissions for Laravel directories
- Secure Nginx configuration with security headers
- Input validation and sanitization

## 🐛 Troubleshooting

### Common Issues

1. **Python script not running**: Ensure Python 3 is installed and accessible
2. **Nginx not found**: Install Nginx in WSL and ensure it's running
3. **Permission denied**: Check WSL directory permissions
4. **Certificate errors**: Verify `mkcert` is installed and certificates are valid

### Debug Mode

Enable debug logging by checking the browser console and terminal output.

## 📁 Project Structure

```
├── app/
│   ├── api/                 # API routes
│   ├── components/          # React components
│   ├── dashboard/           # Dashboard page
│   └── globals.css         # Global styles
├── lib/
│   └── database.ts         # Database utilities
├── scripts/
│   └── setup_laravel_site.py # Python setup script
├── data/                   # SQLite database files
└── public/                 # Static assets
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
- FontAwesome for the beautiful icons
- The Laravel community for inspiration

## 📞 Support

For support and questions, please open an issue on GitHub or contact the development team.

---

**Happy Coding! 🚀**

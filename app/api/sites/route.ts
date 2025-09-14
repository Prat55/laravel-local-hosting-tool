import { NextRequest, NextResponse } from 'next/server';
import { dbUtils } from '../../../lib/database';

export async function GET() {
    try {
        const sites = dbUtils.getAllSites();
        return NextResponse.json({ success: true, data: sites });
    } catch (error) {
        console.error('Error fetching sites:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch sites' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { siteName, sitePath } = await request.json();

        if (!siteName || !sitePath) {
            return NextResponse.json({ success: false, error: 'Site name and path are required' }, { status: 400 });
        }

        // Create site in database
        const siteId = dbUtils.createSite(siteName, sitePath);

        // Get certificate path from settings
        const certificatePath = dbUtils.getSetting('windows_certificate_path');
        if (!certificatePath) {
            return NextResponse.json({ success: false, error: 'Certificate path not configured' }, { status: 400 });
        }

        // Start Python setup script in background
        const scriptPath = process.cwd() + '/scripts/setup_laravel_site.py';
        const command = `python3 "${scriptPath}" "${siteName}" "${sitePath}" "${certificatePath}" "${siteId}"`;

        // Run in background (WSL/Linux)
        const { spawn } = require('child_process');
        const child = spawn('bash', ['-c', command], {
            detached: true,
            stdio: 'ignore'
        });
        child.unref();

        return NextResponse.json({
            success: true,
            data: {
                siteId,
                siteName,
                sitePath,
                status: 'In Progress'
            }
        });

    } catch (error) {
        console.error('Error creating site:', error);
        return NextResponse.json({ success: false, error: 'Failed to create site' }, { status: 500 });
    }
}

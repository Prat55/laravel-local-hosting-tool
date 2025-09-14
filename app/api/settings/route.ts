import { NextRequest, NextResponse } from 'next/server';
import { dbUtils } from '@/lib/database';

export async function GET() {
    try {
        const settings = dbUtils.getAllSettings();
        return NextResponse.json({ success: true, data: settings });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Failed to fetch settings' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const { key, value } = await request.json();

        if (!key || !value) {
            return NextResponse.json(
                { success: false, error: 'Key and value are required' },
                { status: 400 }
            );
        }

        dbUtils.setSetting(key, value);
        return NextResponse.json({ success: true, message: 'Setting saved successfully' });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Failed to save setting' },
            { status: 500 }
        );
    }
}

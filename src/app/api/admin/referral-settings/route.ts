import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const cookie = req.cookies.get('access_token');
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

        const response = await fetch(`${backendUrl}/api/admin/referral-settings`, {
            headers: {
                'Authorization': `Bearer ${cookie?.value}`,
                'Accept': 'application/json',
            },
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const cookie = req.cookies.get('access_token');
        const body = await req.json();
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

        const response = await fetch(`${backendUrl}/api/admin/referral-settings`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${cookie?.value}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}

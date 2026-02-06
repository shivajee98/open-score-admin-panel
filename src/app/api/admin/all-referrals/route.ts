import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const cookie = req.cookies.get('access_token');
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

        const response = await fetch(`${backendUrl}/api/admin/all-referrals`, {
            headers: {
                'Authorization': `Bearer ${cookie?.value}`,
                'Accept': 'application/json',
            },
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch referrals' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const gasUrl = (
    process.env.GAS_CALENDAR_WEB_APP_URL ||

    ''
  ).trim();

  if (!gasUrl) {
    return NextResponse.json(
      { success: false, error: 'Calendar Apps Script URL not configured on server.' },
      { status: 500 },
    );
  }

  try {
    const body = await request.json();
    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Calendar backend returned status ${response.status}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
}

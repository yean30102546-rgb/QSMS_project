import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const gasUrl = (
    process.env.GAS_WEB_APP_URL || 
    process.env.REACT_APP_GAS_WEB_APP_URL || 
    process.env.VITE_GAS_WEB_APP_URL ||
    ''
  ).trim();

  if (!gasUrl) {
    console.error('❌ QSMS API Proxy Error: Apps Script URL not configured in environment.');
    return NextResponse.json(
      { success: false, error: 'Apps Script URL not configured on the server.' },
      { status: 500 }
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
        { success: false, error: `Apps Script backend returned status ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ QSMS API Proxy Fetch Failure:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

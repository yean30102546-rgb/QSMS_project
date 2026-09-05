import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { LineNotificationService } from '../../../../services/lineNotificationService';
import { supabaseServer } from '../../../../lib/supabaseServer';

export const dynamic = 'force-dynamic';

function verifyLineSignature(body: string, signature: string | null, channelSecret: string): boolean {
  if (!signature || !channelSecret) return true; // Bypass if secret not yet configured in local dev
  try {
    const hash = crypto.createHmac('sha256', channelSecret).update(body).digest('base64');
    return hash === signature;
  } catch (err) {
    console.error('[LINE Signature Error]', err);
    return false;
  }
}

/**
 * GET /api/notifications/line
 * Health check and view registered notification channels
 */
export async function GET() {
  try {
    const { data: channels, error } = await supabaseServer
      .from('line_notification_channels')
      .select('*')
      .order('updated_at', { ascending: false });

    return NextResponse.json({
      status: 'online',
      channelsCount: channels?.length || 0,
      channels: channels || [],
      error: error ? error.message : null,
    });
  } catch (err: any) {
    return NextResponse.json({ status: 'error', message: err.message }, { status: 500 });
  }
}

/**
 * POST /api/notifications/line
 * Webhook handler for LINE Messaging API
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-line-signature');
    const channelSecret = process.env.LINE_CHANNEL_SECRET || '';

    // Verify signature if secret configured
    if (channelSecret && !verifyLineSignature(rawBody, signature, channelSecret)) {
      console.warn('[LINE Webhook] Invalid signature detected.');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody || '{}');
    const events = payload.events || [];

    for (const event of events) {
      // 1. Handle Join event (Bot invited to a group)
      if (event.type === 'join' && event.source?.groupId) {
        const replyToken = event.replyToken;
        const groupId = event.source.groupId;
        const welcomeText = 
          `👋 สวัสดีครับ บอทระบบ QSMS Rework พร้อมทำงานแล้ว!\n\n` +
          `เพื่อเปิดรับการแจ้งเตือนงาน Rework ในกลุ่มนี้ กรุณาพิมพ์:\n` +
          `👉 #reg <ชื่อแผนก>\n\n` +
          `ตัวอย่าง:\n` +
          `• #reg SFC_LINE (สำหรับกลุ่มไลน์สายการผลิต)\n` +
          `• #reg QSMS_QC (สำหรับกลุ่มตรวจสอบคุณภาพ)\n` +
          `• #reg WPK_SUPPLY (สำหรับกลุ่มคลังกล่อง/บรรจุภัณฑ์)\n\n` +
          `🆔 Group ID: ${groupId}`;

        if (replyToken) {
          await LineNotificationService.replyMessage(replyToken, [{ type: 'text', text: welcomeText }]);
        }
      }

      // 2. Handle Text messages for Command Registration
      if (event.type === 'message' && event.message?.type === 'text') {
        const text = (event.message.text || '').trim();
        const replyToken = event.replyToken;
        const targetId = event.source.groupId || event.source.userId;

        // Command: #reg <CHANNEL_KEY>
        if (text.startsWith('#reg')) {
          const parts = text.split(/\s+/);
          const channelKey = (parts[1] || 'SFC_LINE').toUpperCase();

          if (!targetId) {
            if (replyToken) {
              await LineNotificationService.replyMessage(replyToken, [{
                type: 'text',
                text: '❌ ไม่สามารถดึง ID ของห้องแชทได้ กรุณาลองใหม่ในกลุ่มไลน์',
              }]);
            }
            continue;
          }

          const isSaved = await LineNotificationService.registerGroupChannel(
            channelKey,
            targetId,
            event.source.type === 'group' ? 'LINE Group' : 'Direct Chat',
            event.source.userId || ''
          );

          if (replyToken) {
            const replyMsg = isSaved
              ? `✅ ลงทะเบียนช่องทางแจ้งเตือนสำเร็จ!\n\n` +
                `🏷️ แผนก/ช่องทาง: ${channelKey}\n` +
                `🆔 Target ID: ${targetId}\n` +
                `🕒 บันทึกเวลา: ${new Date().toLocaleTimeString('th-TH')}\n\n` +
                `ระบบ QSMS จะส่งแจ้งเตือนเคส Rework เข้าห้องนี้โดยอัตโนมัติ`
              : `❌ เกิดข้อผิดพลาดในการบันทึกข้อมูลลงฐานข้อมูล กรุณาลองใหม่อีกครั้ง`;

            await LineNotificationService.replyMessage(replyToken, [{ type: 'text', text: replyMsg }]);
          }
        }

        // Command: #id or #info
        else if (text === '#id' || text === '#info') {
          if (replyToken) {
            const infoMsg = 
              `ℹ️ ข้อมูลการเชื่อมต่อ LINE\n\n` +
              `• Target Type: ${event.source.type}\n` +
              `• Target ID: ${targetId}\n` +
              `• User ID ผู้ส่ง: ${event.source.userId || '-'}\n\n` +
              `พิมพ์ #reg <ชื่อแผนก> เพื่อบันทึกกลุ่มนี้เข้าสู่ระบบ QSMS`;
            await LineNotificationService.replyMessage(replyToken, [{ type: 'text', text: infoMsg }]);
          }
        }
      }
    }

    return NextResponse.json({ success: true, processedEvents: events.length });
  } catch (err: any) {
    console.error('[LINE Webhook Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

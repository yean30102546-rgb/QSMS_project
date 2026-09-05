import { supabaseServer } from '../lib/supabaseServer';

const LINE_MESSAGING_API = 'https://api.line.me/v2/bot/message';

/**
 * Line Notification Service for QSMS Rework Management
 * Supports group messaging, dynamic Flex Messages, and audit logging.
 */
export class LineNotificationService {
  private static getChannelAccessToken(): string {
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!token) {
      console.warn('[LINE] LINE_CHANNEL_ACCESS_TOKEN is not configured.');
    }
    return token || '';
  }

  /**
   * Send a push message to a LINE Group ID or User ID
   */
  static async pushMessage(to: string, messages: any[], caseId?: string, eventType: string = 'GENERIC_ALERT'): Promise<boolean> {
    const token = this.getChannelAccessToken();
    if (!token) {
      console.error('[LINE] Cannot push message: Missing LINE_CHANNEL_ACCESS_TOKEN');
      return false;
    }

    try {
      const response = await fetch(`${LINE_MESSAGING_API}/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to,
          messages,
        }),
      });

      const isSuccess = response.ok;
      let errorText = '';
      if (!isSuccess) {
        errorText = await response.text();
        console.error(`[LINE Push Error] Status ${response.status}: ${errorText}`);
      }

      // Log to database
      try {
        await supabaseServer.from('line_notification_logs').insert({
          case_id: caseId || null,
          channel_key: to.startsWith('C') ? 'GROUP' : 'USER',
          event_type: eventType,
          payload: { to, messagesCount: messages.length },
          status: isSuccess ? 'SUCCESS' : 'FAILED',
          error_message: isSuccess ? null : errorText,
        });
      } catch (logErr) {
        console.warn('[LINE Log Error]', logErr);
      }

      return isSuccess;
    } catch (err: any) {
      console.error('[LINE Network Error]', err);
      return false;
    }
  }

  /**
   * Reply to a message using replyToken
   */
  static async replyMessage(replyToken: string, messages: any[]): Promise<boolean> {
    const token = this.getChannelAccessToken();
    if (!token) return false;

    try {
      const response = await fetch(`${LINE_MESSAGING_API}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          replyToken,
          messages,
        }),
      });
      return response.ok;
    } catch (err) {
      console.error('[LINE Reply Error]', err);
      return false;
    }
  }

  /**
   * Register or update a group notification channel
   */
  static async registerGroupChannel(channelKey: string, groupId: string, groupName: string = '', registeredBy: string = ''): Promise<boolean> {
    const normalizedKey = channelKey.toUpperCase().trim();
    const { error } = await supabaseServer
      .from('line_notification_channels')
      .upsert({
        channel_key: normalizedKey,
        group_id: groupId,
        group_name: groupName,
        registered_by: registeredBy,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'channel_key' });

    if (error) {
      console.error('[LINE] Error upserting channel:', error);
      return false;
    }
    return true;
  }

  /**
   * Get registered Group ID by channel key (e.g. 'SFC_LINE', 'QSMS_ALERTS')
   */
  static async getChannelGroupId(channelKey: string): Promise<string | null> {
    const normalizedKey = channelKey.toUpperCase().trim();
    const { data, error } = await supabaseServer
      .from('line_notification_channels')
      .select('group_id')
      .eq('channel_key', normalizedKey)
      .maybeSingle();

    if (error || !data) return null;
    return data.group_id;
  }

  /**
   * Build a modern Dark-Mode Flex Message for Rework Case Alerts
   */
  static buildCaseAlertFlexMessage(params: {
    caseId: string;
    caseType: 'RT' | 'RW';
    title: string;
    status: string;
    itemsCount: number;
    totalAmount: number;
    reporter: string;
    webUrl?: string;
  }) {
    const isRW = params.caseType === 'RW';
    const primaryColor = isRW ? '#F59E0B' : '#38BDF8';
    const statusColor = params.status === 'Completed' ? '#10B981' : '#F59E0B';

    return {
      type: 'flex',
      altText: `[QSMS แจ้งเตือน] เคส ${params.caseId} (${params.status})`,
      contents: {
        type: 'bubble',
        size: 'mega',
        header: {
          type: 'box',
          layout: 'vertical',
          backgroundColor: '#070B16',
          paddingTop: '20px',
          paddingBottom: '16px',
          contents: [
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: 'QSMS × SFC',
                  size: 'xs',
                  weight: 'bold',
                  color: primaryColor,
                  letterSpacing: '2px',
                },
                {
                  type: 'text',
                  text: params.status,
                  size: 'xs',
                  weight: 'bold',
                  color: statusColor,
                  align: 'end',
                },
              ],
            },
            {
              type: 'text',
              text: params.caseId,
              size: 'xl',
              weight: 'bold',
              color: '#FFFFFF',
              margin: 'md',
            },
            {
              type: 'text',
              text: params.title,
              size: 'sm',
              color: '#94A3B8',
              margin: 'xs',
            },
          ],
        },
        body: {
          type: 'box',
          layout: 'vertical',
          backgroundColor: '#0F172A',
          paddingTop: '16px',
          paddingBottom: '20px',
          contents: [
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                { type: 'text', text: 'จำนวนรายการ:', size: 'sm', color: '#64748B', flex: 4 },
                { type: 'text', text: `${params.itemsCount} รายการ`, size: 'sm', color: '#F8FAFC', weight: 'bold', flex: 6, align: 'end' },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              margin: 'md',
              contents: [
                { type: 'text', text: 'ยอดชิ้นงานรวม:', size: 'sm', color: '#64748B', flex: 4 },
                { type: 'text', text: `${params.totalAmount.toLocaleString()} ชิ้น`, size: 'sm', color: '#10B981', weight: 'bold', flex: 6, align: 'end' },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              margin: 'md',
              contents: [
                { type: 'text', text: 'ผู้เปิดเคส:', size: 'sm', color: '#64748B', flex: 4 },
                { type: 'text', text: params.reporter || '-', size: 'sm', color: '#F8FAFC', flex: 6, align: 'end' },
              ],
            },
          ],
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          backgroundColor: '#070B16',
          paddingAll: '16px',
          contents: [
            {
              type: 'button',
              action: {
                type: 'uri',
                label: 'เปิดดูรายละเอียดเคส',
                uri: params.webUrl || 'https://qsms-rework.vercel.app',
              },
              style: 'primary',
              color: '#10B981',
              height: 'sm',
            },
          ],
        },
      },
    };
  }
}

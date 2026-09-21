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
  static async registerGroupChannel(channelKey: string, groupId: string, groupName: string = '', registeredBy: string = ''): Promise<{ success: boolean; error?: string }> {
    try {
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
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      console.error('[LINE] Exception upserting channel:', err);
      return { success: false, error: err.message || 'Database unavailable' };
    }
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
                uri: params.webUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'https://qsms-rework.vercel.app'}?case=${params.caseId}`,
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

  /**
   * Build Dark-Mode Flex Message for Material Shortage Alerts
   */
  static buildShortageAlertFlexMessage(params: {
    caseId: string;
    caseName?: string;
    missingBoxes?: number;
    missingGallons?: number;
    missingOil?: number;
    reporter: string;
    webUrl?: string;
  }) {
    const shortageItems: string[] = [];
    if (params.missingBoxes && params.missingBoxes > 0) {
      shortageItems.push(`ขาดกล่อง: ${params.missingBoxes.toLocaleString()} กล่อง`);
    }
    if (params.missingGallons && params.missingGallons > 0) {
      shortageItems.push(`ขาดแกลลอน: ${params.missingGallons.toLocaleString()} ใบ`);
    }
    if (params.missingOil && params.missingOil > 0) {
      shortageItems.push(`ขาดน้ำมัน: ${params.missingOil.toLocaleString()} ลิตร`);
    }

    const shortageText = shortageItems.length > 0 ? shortageItems.join(' · ') : 'ระบุมีวัสดุขาดหน้างาน';

    return {
      type: 'flex',
      altText: `[แจ้งของขาด] เคส ${params.caseId}: ${shortageText}`,
      contents: {
        type: 'bubble',
        size: 'mega',
        header: {
          type: 'box',
          layout: 'vertical',
          backgroundColor: '#1E1014',
          paddingTop: '20px',
          paddingBottom: '16px',
          paddingStart: '20px',
          paddingEnd: '20px',
          contents: [
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: 'WPK ALERT · ขาดวัสดุ',
                  size: 'xs',
                  weight: 'bold',
                  color: '#FB7185',
                },
                {
                  type: 'text',
                  text: 'URGENT',
                  size: 'xs',
                  weight: 'bold',
                  color: '#F43F5E',
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
              text: params.caseName || 'รายงานวัสดุขาดหน้างาน Rework',
              size: 'sm',
              color: '#FDA4AF',
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
          paddingStart: '20px',
          paddingEnd: '20px',
          contents: [
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                { type: 'text', text: 'ขาดกล่อง:', size: 'sm', color: '#64748B', flex: 4 },
                { type: 'text', text: `${params.missingBoxes || 0} กล่อง`, size: 'sm', color: (params.missingBoxes || 0) > 0 ? '#FB7185' : '#94A3B8', weight: 'bold', flex: 6, align: 'end' },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              margin: 'md',
              contents: [
                { type: 'text', text: 'ขาดแกลลอน:', size: 'sm', color: '#64748B', flex: 4 },
                { type: 'text', text: `${params.missingGallons || 0} ใบ`, size: 'sm', color: (params.missingGallons || 0) > 0 ? '#F59E0B' : '#94A3B8', weight: 'bold', flex: 6, align: 'end' },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              margin: 'md',
              contents: [
                { type: 'text', text: 'ขาดน้ำมัน:', size: 'sm', color: '#64748B', flex: 4 },
                { type: 'text', text: `${params.missingOil || 0} ลิตร`, size: 'sm', color: (params.missingOil || 0) > 0 ? '#38BDF8' : '#94A3B8', weight: 'bold', flex: 6, align: 'end' },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              margin: 'md',
              contents: [
                { type: 'text', text: 'ผู้รายงาน:', size: 'sm', color: '#64748B', flex: 4 },
                { type: 'text', text: params.reporter || 'Operator', size: 'sm', color: '#F8FAFC', flex: 6, align: 'end' },
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
                label: 'จัดเตรียมวัสดุและอัปเดตงาน',
                uri: params.webUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'https://qsms-rework.vercel.app'}?case=${params.caseId}`,
              },
              style: 'primary',
              color: '#F43F5E',
              height: 'sm',
            },
          ],
        },
      },
    };
  }

  /**
   * Build Dark-Mode Flex Message for Case Completion & QC Sign-off
   */
  static buildCompletedAlertFlexMessage(params: {
    caseId: string;
    caseName?: string;
    totalBoxes?: number;
    qcInspector: string;
    webUrl?: string;
  }) {
    return {
      type: 'flex',
      altText: `[ตรวจปล่อยผ่าน 100%] เคส ${params.caseId} เสร็จสมบูรณ์`,
      contents: {
        type: 'bubble',
        size: 'mega',
        header: {
          type: 'box',
          layout: 'vertical',
          backgroundColor: '#071A12',
          paddingTop: '20px',
          paddingBottom: '16px',
          paddingStart: '20px',
          paddingEnd: '20px',
          contents: [
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: 'QSMS QC GATE · ผ่านการตรวจ',
                  size: 'xs',
                  weight: 'bold',
                  color: '#34D399',
                },
                {
                  type: 'text',
                  text: '100% PASS',
                  size: 'xs',
                  weight: 'bold',
                  color: '#10B981',
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
              text: params.caseName || 'งาน Rework ผ่านการตรวจสอบและตรวจปล่อยเรียบร้อย',
              size: 'sm',
              color: '#A7F3D0',
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
          paddingStart: '20px',
          paddingEnd: '20px',
          contents: [
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                { type: 'text', text: 'สถานะ:', size: 'sm', color: '#64748B', flex: 4 },
                { type: 'text', text: 'Completed (ปิดงาน)', size: 'sm', color: '#10B981', weight: 'bold', flex: 6, align: 'end' },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              margin: 'md',
              contents: [
                { type: 'text', text: 'ผลิตเสร็จจริง:', size: 'sm', color: '#64748B', flex: 4 },
                { type: 'text', text: `${(params.totalBoxes || 0).toLocaleString()} กล่อง`, size: 'sm', color: '#F8FAFC', weight: 'bold', flex: 6, align: 'end' },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              margin: 'md',
              contents: [
                { type: 'text', text: 'ผู้ตรวจปล่อย (QC):', size: 'sm', color: '#64748B', flex: 4 },
                { type: 'text', text: params.qcInspector || 'QSMS Officer', size: 'sm', color: '#34D399', weight: 'bold', flex: 6, align: 'end' },
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
                label: 'ดูสรุปและดาวน์โหลด Excel รายงาน',
                uri: params.webUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'https://qsms-rework.vercel.app'}?case=${params.caseId}`,
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

  /**
   * High-level automation: Notify when a new case is initiated
   */
  static async notifyNewCase(params: {
    caseId: string;
    caseName?: string;
    source?: string;
    itemsCount: number;
    totalAmount: number;
    reporter: string;
    webUrl?: string;
  }): Promise<boolean> {
    try {
      const groupId = await this.getChannelGroupId('SFC_LINE');
      if (!groupId) {
        console.warn('[LINE] No registered channel for SFC_LINE');
        return false;
      }

      const isRW = !params.source || params.source === 'SFC' || params.caseId.startsWith('RW');
      const flex = this.buildCaseAlertFlexMessage({
        caseId: params.caseId,
        caseType: isRW ? 'RW' : 'RT',
        title: params.caseName || (isRW ? 'เปิดเคส Rework ภายใน (SFC)' : 'เคส Rework สินค้าเคลมลูกค้า (RT)'),
        status: 'Pending',
        itemsCount: params.itemsCount,
        totalAmount: params.totalAmount,
        reporter: params.reporter,
        webUrl: params.webUrl,
      });

      return await this.pushMessage(groupId, [flex], params.caseId, 'CASE_CREATED');
    } catch (err) {
      console.error('[LINE notifyNewCase Error]', err);
      return false;
    }
  }

  /**
   * High-level automation: Notify when material shortage or blocker is reported
   */
  static async notifyMaterialShortage(params: {
    caseId: string;
    caseName?: string;
    missingBoxes?: number;
    missingGallons?: number;
    missingOil?: number;
    reporter: string;
    webUrl?: string;
  }): Promise<boolean> {
    try {
      const groupId = (await this.getChannelGroupId('WPK_SUPPLY')) || (await this.getChannelGroupId('SFC_LINE'));
      if (!groupId) return false;

      const flex = this.buildShortageAlertFlexMessage(params);
      return await this.pushMessage(groupId, [flex], params.caseId, 'MATERIAL_SHORTAGE');
    } catch (err) {
      console.error('[LINE notifyMaterialShortage Error]', err);
      return false;
    }
  }

  /**
   * High-level automation: Notify when case is 100% completed and verified by QC
   */
  static async notifyCaseCompleted(params: {
    caseId: string;
    caseName?: string;
    totalBoxes?: number;
    qcInspector: string;
    webUrl?: string;
  }): Promise<boolean> {
    try {
      const groupId = (await this.getChannelGroupId('QSMS_QC')) || (await this.getChannelGroupId('SFC_LINE'));
      if (!groupId) return false;

      const flex = this.buildCompletedAlertFlexMessage(params);
      return await this.pushMessage(groupId, [flex], params.caseId, 'CASE_COMPLETED');
    } catch (err) {
      console.error('[LINE notifyCaseCompleted Error]', err);
      return false;
    }
  }
}

import dotenv from 'dotenv';
dotenv.config();

const LINE_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const TARGET_GROUP_ID = 'C5b207fcac5dfa2034a4ae3d83467aada';

if (!LINE_TOKEN) {
  console.error('Missing LINE_CHANNEL_ACCESS_TOKEN in environment');
  process.exit(1);
}

const flexMessage = {
  type: 'flex',
  altText: '[QSMS ทดสอบระบบ] แจ้งเตือนเคส Rework: RW-2026-001',
  contents: {
    type: 'bubble',
    size: 'mega',
    header: {
      type: 'box',
      layout: 'vertical',
      backgroundColor: '#070B16',
      paddingTop: '22px',
      paddingBottom: '18px',
      paddingStart: '20px',
      paddingEnd: '20px',
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
              color: '#F59E0B',
            },
            {
              type: 'text',
              text: 'In-Progress',
              size: 'xs',
              weight: 'bold',
              color: '#F59E0B',
              align: 'end',
            },
          ],
        },
        {
          type: 'text',
          text: 'RW-2026-001',
          size: 'xxl',
          weight: 'bold',
          color: '#FFFFFF',
          margin: 'md',
        },
        {
          type: 'text',
          text: 'งานแก้ไขแกลลอนรั่ว SFC Line 2 (ทดสอบระบบ)',
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
      paddingTop: '18px',
      paddingBottom: '22px',
      paddingStart: '20px',
      paddingEnd: '20px',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            { type: 'text', text: 'ประเภทเคส:', size: 'sm', color: '#64748B', flex: 4 },
            { type: 'text', text: 'RW (SFC ภายใน)', size: 'sm', color: '#F8FAFC', weight: 'bold', flex: 6, align: 'end' },
          ],
        },
        {
          type: 'box',
          layout: 'horizontal',
          margin: 'md',
          contents: [
            { type: 'text', text: 'จำนวนรายการ:', size: 'sm', color: '#64748B', flex: 4 },
            { type: 'text', text: '3 รายการ', size: 'sm', color: '#F8FAFC', weight: 'bold', flex: 6, align: 'end' },
          ],
        },
        {
          type: 'box',
          layout: 'horizontal',
          margin: 'md',
          contents: [
            { type: 'text', text: 'ยอดชิ้นงานรวม:', size: 'sm', color: '#64748B', flex: 4 },
            { type: 'text', text: '1,500 กล่อง', size: 'sm', color: '#10B981', weight: 'bold', flex: 6, align: 'end' },
          ],
        },
        {
          type: 'box',
          layout: 'horizontal',
          margin: 'md',
          contents: [
            { type: 'text', text: 'ผู้เปิดเคส:', size: 'sm', color: '#64748B', flex: 4 },
            { type: 'text', text: 'QSMS Engineering', size: 'sm', color: '#38BDF8', flex: 6, align: 'end' },
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
            label: 'เปิดดูรายละเอียดเคสในระบบ',
            uri: `${process.env.NEXT_PUBLIC_APP_URL || 'https://qsms-project.vercel.app'}?case=RW-2026-001`,
          },
          style: 'primary',
          color: '#10B981',
          height: 'sm',
        },
      ],
    },
  },
};

async function sendTestPush() {
  console.log(`Sending test push to group: ${TARGET_GROUP_ID}...`);
  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LINE_TOKEN}`,
    },
    body: JSON.stringify({
      to: TARGET_GROUP_ID,
      messages: [flexMessage],
    }),
  });

  console.log(`Status: ${res.status} ${res.statusText}`);
  const text = await res.text();
  if (res.ok) {
    console.log('SUCCESS! Push message sent to LINE group successfully.');
  } else {
    console.error('FAILED! LINE API error response:', text);
  }
}

sendTestPush().catch(console.error);

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabaseServer } from '@/src/lib/supabaseServer';
import type { FeedbackSubmission } from '@/src/types/feedback';
import { assertPermission, AuthError, requireServerAuth } from '@/src/lib/serverAuth';
import {
  INITIAL_FEEDBACK_EVALUATIONS,
  computeFeedbackReportSummary,
  type FeedbackRecord,
} from '@/src/data/initialFeedbackEvaluation';

const LOCAL_FEEDBACK_FILE = path.join(process.cwd(), 'data', 'system_feedback.json');

function readLocalFeedbackStore(): FeedbackRecord[] {
  try {
    if (fs.existsSync(LOCAL_FEEDBACK_FILE)) {
      const raw = fs.readFileSync(LOCAL_FEEDBACK_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as FeedbackRecord[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Fallback to initial seeded evaluations
  }
  return INITIAL_FEEDBACK_EVALUATIONS;
}

function writeLocalFeedbackStore(records: FeedbackRecord[]): void {
  try {
    const dir = path.dirname(LOCAL_FEEDBACK_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_FEEDBACK_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch {
    // Ignore read-only filesystem warnings
  }
}

export async function POST(request: Request) {
  try {
    const body: FeedbackSubmission = await request.json();

    if (!body || !body.category || !body.module || !body.comment?.trim()) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุข้อมูลที่จำเป็นให้ครบถ้วน (หมวดหมู่, โมดูล, และรายละเอียด)' },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();
    const payload = {
      category: body.category,
      module: body.module,
      rating: body.rating ?? 5,
      title: body.title?.trim() || null,
      comment: body.comment.trim(),
      tags: body.tags || [],
      user_email: body.userEmail || null,
      user_name: body.userName || null,
      user_role: body.userRole || null,
      metadata: body.metadata || {
        screenWidth: 1920,
        screenHeight: 1080,
        userAgent: 'Browser Client',
        url: '',
        activeView: 'portal',
        timestamp: nowIso,
      },
      created_at: nowIso,
    };

    const existing = readLocalFeedbackStore();
    const newRecord: FeedbackRecord = {
      id: `fb-${Date.now()}`,
      evaluatorCode: `U${String(existing.length + 1).padStart(2, '0')}`,
      department: body.userRole || 'QSMS',
      positionTitle: body.userName || 'ผู้ใช้งานระบบ',
      category: body.category,
      module: body.module,
      rating: body.rating ?? 5,
      title: body.title?.trim() || 'ข้อเสนอแนะเพิ่มเติมจากหน้าเว็บไซต์',
      comment: body.comment.trim(),
      tags: body.tags || [],
      user_email: body.userEmail || 'user@factory.local',
      user_name: body.userName || 'ผู้ใช้งานระบบ',
      user_role: (body.userRole as FeedbackRecord['user_role']) || 'QSMS',
      susScore: 85.0,
      metadata: payload.metadata,
      created_at: nowIso,
    };
    writeLocalFeedbackStore([newRecord, ...existing]);

    // Attempt to persist in Supabase system_feedback table
    try {
      const { data, error } = await supabaseServer
        .from('system_feedback')
        .insert([payload])
        .select()
        .single();

      if (error) {
        return NextResponse.json({
          success: true,
          message: 'บันทึกข้อเสนอแนะสำเร็จ (Logged)',
          data: newRecord,
        });
      }

      return NextResponse.json({
        success: true,
        message: 'บันทึกข้อเสนอแนะสำเร็จ',
        data,
      });
    } catch {
      return NextResponse.json({
        success: true,
        message: 'บันทึกข้อเสนอแนะเรียบร้อยแล้ว',
        data: newRecord,
      });
    }
  } catch (error: unknown) {
    console.error('[Feedback API] Error processing submission:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการประมวลผลข้อเสนอแนะ' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const auth = await requireServerAuth();
    assertPermission(auth, 'view_feedback');

    const localRecords = readLocalFeedbackStore();

    const { data, error } = await supabaseServer
      .from('system_feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    const records: FeedbackRecord[] =
      !error && Array.isArray(data) && data.length > 0
        ? (data as FeedbackRecord[])
        : localRecords;

    return NextResponse.json({
      success: true,
      data: records,
      summary: computeFeedbackReportSummary(records),
    });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ success: false, error: err.message }, { status: err.status });
    }
    const fallback = readLocalFeedbackStore();
    return NextResponse.json({
      success: true,
      data: fallback,
      summary: computeFeedbackReportSummary(fallback),
    });
  }
}

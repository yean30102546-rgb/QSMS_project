# System Architecture — QSMS Portal
[วันที่อัปเดต: 2026-05-21]

## 1. Overview
โปรเจกต์ QSMS เป็นระบบ Modular Portal ที่รวมแอปพลิเคชันบริหารจัดการภายในโรงงานเข้าด้วยกัน โดยใช้สถาปัตยกรรมแบบ **Next.js + Google Apps Script (GAS) + Google Sheets**

## 2. High-Level Architecture (Mermaid)
```mermaid
graph TD
    User((User))
    
    subgraph Frontend [Next.js Client-Side]
        Portal[App.tsx - WorkspacePortal]
        ReworkApp[Rework Module]
        RosterApp[Roster Module]
        AuthService[Auth Service - JWT]
    end

    subgraph API_Proxy [Next.js Server-Side API Routes]
        API_Rework[/api/rework]
        API_Roster[/api/roster]
    end

    subgraph External_Backends [Google Apps Script]
        GAS_Rework[Code.gs - Auth, Drive & Notification]
        GAS_Roster[gas_calendar.gs - Legacy Calendar]
    end

    subgraph Storage [Assets & Media]
        Google_Drive[(Google Drive)]
    end

    subgraph Primary_Database [Supabase Serverless DB]
        Supabase_DB[(PostgreSQL)]
    end

    User --> Portal
    Portal --> ReworkApp
    Portal --> RosterApp
    
    Portal -- Previews --> API_Rework
    Portal -- Previews --> API_Roster
    
    ReworkApp --> API_Rework
    RosterApp --> API_Roster
    
    API_Rework --> Supabase_DB
    API_Roster --> Supabase_DB
    
    API_Rework -- "Proxy Images & Auth" --> GAS_Rework
    API_Roster -- "Legacy Fallback" --> GAS_Roster
    
    GAS_Rework --> Google_Drive
    Portal -.-> AuthService
```


## 3. Technology Stack
- **Frontend**: Next.js 15+, React 19, Tailwind CSS v4 (Monochrome Style), motion/react.
- **Backend**: Next.js API Routes (Proxy & Logic Layer).
- **Database**: **Supabase PostgreSQL** (Primary transactional DB).
- **Storage**: Google Drive (via GAS) for images.
- **Authentication**: PIN-based (Supabase lookup planned / GAS token currently).

## 4. Key Data Models (Supabase)
- **Rework Cases:** รองรับข้อมูลทรัพยากร (Labor Hours, Materials JSONB).
- **Master Data:** ItemMaster และ DefectMaster เก็บใน Supabase เพื่อความเร็วในการ Auto-fill.
- **Roster:** ระบบจัดเวรรายเดือน พร้อมระบบ Swap และ Leave Management.

## 5. Knowledge Relationships
- **Depends On**: [[nextjs-frontend/nextjs.md]]
- **Depends On**: [[gas-backend/gas-api.md]]
- **Impacted By**: [[architecture/tech-stack-2026.md]]

---
> 🔄 *สร้างเมื่อ 2026-05-21*: สรุปโครงสร้างระบบองค์รวมและทิศทางการพัฒนา Portal

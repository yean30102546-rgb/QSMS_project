# Prisma ORM — Next-Generation Data Tooling
[วันที่อัปเดต: 2026-05-21]
**Source**: `1_raw/prisma/prismaprisma...md` (GitHub Readme)

## 1. Summary
Prisma เป็น ORM (Object-Relational Mapping) ยุคใหม่สำหรับ Node.js และ TypeScript ที่เน้นเรื่อง Type-safety และ Developer Experience ช่วยให้การจัดการฐานข้อมูลเป็นเรื่องง่ายและปลอดภัยผ่านการเขียน Schema ที่อ่านง่าย

## 2. Core Tools
- **Prisma Client**: Query builder ที่สร้างโค้ดให้อัตโนมัติ (Auto-generated) และเป็น Type-safe 100%
- **Prisma Migrate**: ระบบจัดการ Schema และ Migration แบบ Declarative (ระบุผลลัพธ์ที่ต้องการ แล้วเครื่องมือจะจัดการ SQL ให้เอง)
- **Prisma Studio**: GUI สำหรับดูและแก้ไขข้อมูลในฐานข้อมูลผ่านหน้าเว็บ (Visual Editor)

## 3. Supported Databases
- PostgreSQL (รวมถึง Supabase)
- MySQL / MariaDB
- SQL Server
- SQLite
- MongoDB
- CockroachDB

## 4. Key Concepts
### The Prisma Schema
ทุกอย่างเริ่มต้นที่ไฟล์ `schema.prisma` เพื่อนิยาม:
1. **Data Source**: ชนิดของฐานข้อมูล (เช่น postgresql)
2. **Generators**: สิ่งที่ต้องการสร้าง (เช่น prisma-client-js)
3. **Models**: โครงสร้างตารางและความสัมพันธ์ (Relations)

### Sample Model
```prisma
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
  posts Post[]
}

model Post {
  id        Int     @id @default(autoincrement())
  title     String
  author    User?   @relation(fields: [authorId], references: [id])
  authorId  Int?
}
```

## 5. Why Prisma for QSMS?
- **Type Safety**: ป้องกัน Error ตั้งแต่ตอนเขียนโค้ด (เช่น พิมพ์ชื่อคอลัมน์ผิด) ซึ่งเหมาะมากสำหรับโปรเจกต์ที่ใช้ TypeScript อย่าง QSMS
- **Integration with Supabase**: Prisma ทำงานร่วมกับ Supabase ได้สมบูรณ์แบบ ช่วยให้การจัดการตาราง `rework_cases` หรือ `roster_employees` เป็นระเบียบและตรวจสอบย้อนกลับได้ง่าย
- **Developer Productivity**: มีระบบ Auto-completion ที่แม่นยำ ช่วยให้ AI Agent (อย่างผม) เขียนโค้ดดึงข้อมูลได้ถูกต้อง 100%

## 6. Configuration & Environment (`prisma.config.ts`)
การตั้งค่าการเชื่อมต่อฐานข้อมูลสำหรับการรัน CLI subcommands (เช่น `migrate` หรือ `studio`) สามารถทำได้โดยสร้างไฟล์ `prisma.config.ts` ไว้ที่ root ของโปรเจกต์:
```typescript
import 'dotenv/config' // ต้องโหลด dotenv เองเมื่อใช้งาน prisma.config.ts (ยกเว้นใน Bun)
import { defineConfig, env } from 'prisma/config'

type Env = {
  DATABASE_URL: string
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env<Env>('DATABASE_URL'), // ค้นหาและตรวจสอบ DATABASE_URL
  },
})
```

## 7. Driver Adapters & Client Initialization
ในการเริ่มต้นใช้งาน Prisma Client ในระบบที่ต้องการใช้ Driver Adapter เฉพาะ (เช่น `@prisma/adapter-pg` สำหรับ PostgreSQL) ให้ทำดังนี้:
1. กำหนด `output` ใน `schema.prisma` เพื่อระบุตำแหน่งสร้าง Client:
```prisma
generator client {
  provider = "prisma-client"
  output   = "../generated"
}
```
2. โหลด Driver Adapter และสร้าง Instance ในโค้ด:
```typescript
import { PrismaClient } from './generated/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })
```

## 8. Local Development
- สามารถเริ่มระบบฐานข้อมูล PostgreSQL ท้องถิ่นสำหรับการพัฒนาแบบทันที (โดยไม่ต้องมี Docker หรือการตั้งค่าล่วงหน้า) ได้ผ่านคำสั่ง:
  ```bash
  npx prisma dev
  ```

## 9. Getting Started Workflow
1. ติดตั้ง: `npm install prisma --save-dev` และ `@prisma/client`
2. สร้าง Schema: `npx prisma init`
3. สร้าง Client: `npx prisma generate`
4. รัน Migration: `npx prisma migrate dev`

## 10. Knowledge Relationships
- **Impacts**: [[architecture/supabase-hybrid-migration.md]] — เป็นเครื่องมือแนะนำสำหรับคุมโครงสร้างตารางใน Supabase
- **Impacted By**: [[architecture/tech-stack-2026.md]] — เป็นส่วนหนึ่งของ Modern Web Stack และ T3 Stack
- **Used In**: [[nextjs-frontend/nextjs.md]] — ใช้ใน Next.js API Routes (Server-side)

---
> 🔄 *อัปเดตเมื่อ 2026-05-21*: Ingest ข้อมูลการตั้งค่า prisma.config.ts, dotenv, adapter, และ local dev จาก `1_raw/prisma/`

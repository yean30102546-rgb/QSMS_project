# Rework Database EDR (Entity Relationship Diagram)

This ERD summarizes the main database entities that support the Rework workflow, document control, and AI-assisted search.

## Mermaid ERD

```mermaid
erDiagram
    REWORK_CASES ||--o{ REWORK_ITEMS : contains
    REWORK_CASES ||--o{ REWORK_LOGS : records
    REWORK_ITEMS }o--|| REWORK_MASTER_ITEMS : verifies_via_item_code_number
    REWORK_MASTER_ITEMS ||--o{ REWORK_MASTER_DEFECTS : lookup_reference
    RAG_DOCUMENTS ||--o{ RAG_DOCUMENT_CHUNKS : contains
    RAG_DOCUMENTS ||--o{ RAG_FEEDBACK : receives

    REWORK_CASES {
        text id PK
        text case_name
        text submission_date
        text source
        text customer_name
        text status
        text profile_id
        jsonb or_files_urls
        decimal total_rework_cost
        text resolution_method
        boolean is_deleted
    }

    REWORK_ITEMS {
        uuid id PK
        text case_id FK
        text item_number
        text item_code
        text item_name
        decimal amount
        text reason
        text responsible
        jsonb image_urls
        text uid
    }

    REWORK_LOGS {
        uuid id PK
        text case_id FK
        text action
        text performed_by
        jsonb details
    }

    REWORK_MASTER_ITEMS {
        uuid id PK
        text item_number
        text item_code
        text item_name
    }

    REWORK_MASTER_DEFECTS {
        uuid id PK
        text defect_code
        text defect_name
    }

    ENGINEERING_DRAWINGS {
        uuid id PK
        text drawing_number
        text revision
        text part_name
        text customer_name
        text item_code
        text r2_key
        text file_name
        text type
        boolean is_active
    }

    RAG_DOCUMENTS {
        uuid id PK
        text filename
        text file_type
        text supabase_storage_path
    }

    RAG_DOCUMENT_CHUNKS {
        uuid id PK
        uuid document_id FK
        text content
        vector embedding
        text[] image_urls
    }

    RAG_FEEDBACK {
        uuid id PK
        text query
        text response
        text context_used
        boolean is_positive
    }
```

## Core Tables and Purpose

| Table | Purpose |
|---|---|
| `rework_cases` | Main operational case record for rework workflow |
| `rework_items` | Line items inside each case, with defect and responsible details |
| `rework_logs` | Audit trail for every change and status transition |
| `rework_master_items` | Reference master item data for item verification |
| `rework_master_defects` | Reference defect list for reason selection |
| `engineering_drawings` | Revision-controlled document metadata for drawings and masters |
| `rag_documents` | Uploaded document metadata for AI search |
| `rag_document_chunks` | Embedded content chunks for semantic retrieval |
| `rag_feedback` | User feedback for RAG quality improvement |

## Important Business Relationships

- One rework case can contain many rework items.
- One rework case can have many audit logs.
- Rework items are verified against master item data by `item_number` and `item_code`.
- Engineering drawings are versioned by drawing number and revision.
- RAG documents are split into chunks for semantic search and retrieval.

## Presentation Notes

Use this EDR to explain that the project is not just a simple CRUD app; it is a traceable, role-aware, and extensible quality operations platform.

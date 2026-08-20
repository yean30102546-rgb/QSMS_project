import matplotlib.pyplot as plt
import matplotlib.patches as patches
import os

os.makedirs(r"c:\Workplace\Mytask\Projects\QSMS_project\assets", exist_ok=True)

def create_system_architecture_diagram():
    fig, ax = plt.subplots(figsize=(11, 7), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    
    fig.patch.set_facecolor('#FFFFFF')
    ax.set_facecolor('#FFFFFF')
    
    ax.text(50, 96, "QSMS System Architecture & Data Flow", ha='center', va='center', fontsize=15, fontweight='bold', color='#0F172A')
    
    # Layer 1: Client Presentation Layer
    l1_box = patches.FancyBboxPatch((4, 66), 92, 24, boxstyle="round,pad=1.5,rounding_size=2", linewidth=1.5, edgecolor='#3B82F6', facecolor='#EFF6FF')
    ax.add_patch(l1_box)
    ax.text(8, 86.5, "1. Client Presentation Layer (React 19 SPA - Feature-Sliced Design)", fontsize=11, fontweight='bold', color='#1E40AF')
    
    modules = [
        ("rework\nModule", 14), ("drawings\nModule", 32), ("rag (DocAI)\nModule", 50),
        ("roster\nModule", 68), ("guide & deck\nModule", 86)
    ]
    for name, x in modules:
        mbox = patches.FancyBboxPatch((x-7, 69), 14, 13, boxstyle="round,pad=0.8,rounding_size=1.5", linewidth=1.2, edgecolor='#93C5FD', facecolor='#FFFFFF')
        ax.add_patch(mbox)
        ax.text(x, 75.5, name, ha='center', va='center', fontsize=9.5, fontweight='bold', color='#1E3A8A')
        
    ax.annotate('', xy=(50, 57), xytext=(50, 66), arrowprops=dict(arrowstyle="->", lw=2, color='#2563EB'))
    ax.text(50, 61.5, "HTTP-Only Secure Cookie Auth / JSON Payload / SSE Stream", ha='center', va='center', fontsize=8.5, fontweight='semibold', color='#2563EB', backgroundcolor='#FFFFFF')

    # Layer 2: Next.js API Boundary
    l2_box = patches.FancyBboxPatch((4, 34), 92, 22, boxstyle="round,pad=1.5,rounding_size=2", linewidth=1.5, edgecolor='#0D9488', facecolor='#F0FDFA')
    ax.add_patch(l2_box)
    ax.text(8, 52.5, "2. Next.js 16 App Router Boundary & Server Services", fontsize=11, fontweight='bold', color='#0F766E')
    
    handlers = [
        ("JWT Auth\n& Cookie Gate", 15), ("/api/rework\nTransactions", 32),
        ("/api/drawings\nVision Pipeline", 50), ("/api/rag\nRPC Hybrid", 68),
        ("Cloudinary\nDirect Signature", 85)
    ]
    for name, x in handlers:
        hbox = patches.FancyBboxPatch((x-7.5, 37), 15, 12, boxstyle="round,pad=0.8,rounding_size=1.5", linewidth=1.2, edgecolor='#99F6E4', facecolor='#FFFFFF')
        ax.add_patch(hbox)
        ax.text(x, 43, name, ha='center', va='center', fontsize=9, fontweight='bold', color='#115E59')

    ax.annotate('', xy=(28, 25), xytext=(28, 34), arrowprops=dict(arrowstyle="->", lw=2, color='#0D9488'))
    ax.annotate('', xy=(50, 25), xytext=(50, 34), arrowprops=dict(arrowstyle="->", lw=2, color='#0D9488'))
    ax.annotate('', xy=(72, 25), xytext=(72, 34), arrowprops=dict(arrowstyle="->", lw=2, color='#0D9488'))

    # Layer 3: Persistence & AI Layer
    l3_box = patches.FancyBboxPatch((4, 4), 92, 20, boxstyle="round,pad=1.5,rounding_size=2", linewidth=1.5, edgecolor='#6366F1', facecolor='#EEF2FF')
    ax.add_patch(l3_box)
    ax.text(8, 20.5, "3. Persistence, Vector Store & Multimodal Intelligence Layer", fontsize=11, fontweight='bold', color='#4338CA')
    
    backends = [
        ("Supabase Postgres\n(Relational Cases & Master)", 22, '#4F46E5'),
        ("Supabase pgvector\n(Jina Embeddings 768-d)", 47, '#6366F1'),
        ("Cloudinary CDN\n(Compressed Evidence)", 70, '#0284C7'),
        ("Google Gemini\n3.1 Flash / Lite OCR", 88, '#7C3AED')
    ]
    for name, x, col in backends:
        bbox = patches.FancyBboxPatch((x-9, 7), 18, 10.5, boxstyle="round,pad=0.8,rounding_size=1.5", linewidth=1.2, edgecolor=col, facecolor='#FFFFFF')
        ax.add_patch(bbox)
        ax.text(x, 12.2, name, ha='center', va='center', fontsize=8.5, fontweight='bold', color=col)

    plt.tight_layout()
    output_path = r"c:\Workplace\Mytask\Projects\QSMS_project\assets\architecture_diagram.png"
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Architecture diagram saved at: {output_path}")

def create_erd_diagram():
    # Enlarge canvas to 12.5 x 9.5 inches for generous spacing
    fig, ax = plt.subplots(figsize=(12.5, 9.5), dpi=300)
    ax.set_xlim(0, 120)
    ax.set_ylim(0, 105)
    ax.axis('off')
    
    fig.patch.set_facecolor('#FFFFFF')
    ax.set_facecolor('#FFFFFF')
    
    ax.text(60, 101.5, "QSMS Entity-Relationship Diagram (ERD)", ha='center', va='center', fontsize=16, fontweight='bold', color='#0F172A')

    def draw_entity(x, y, w, title, fields, bg_hdr='#1E3A8A', border='#3B82F6'):
        line_h = 2.45
        hdr_h = 4.6
        pad_top = 2.0
        pad_bot = 1.8
        h = hdr_h + pad_top + len(fields) * line_h + pad_bot
        
        # Entity container
        cont = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.5,rounding_size=1.2", linewidth=1.3, edgecolor=border, facecolor='#FFFFFF')
        ax.add_patch(cont)
        
        # Header box
        hdr = patches.FancyBboxPatch((x, y + h - hdr_h), w, hdr_h, boxstyle="round,pad=0.5,rounding_size=1.2", linewidth=1.1, edgecolor=bg_hdr, facecolor=bg_hdr)
        ax.add_patch(hdr)
        ax.text(x + w/2, y + h - hdr_h/2, title, ha='center', va='center', fontsize=9.5, fontweight='bold', color='#FFFFFF')
        
        # Fields text
        y_pos = y + h - hdr_h - pad_top
        for f in fields:
            is_pk = "PK" in f
            is_fk = "FK" in f
            col = '#DC2626' if is_pk else ('#2563EB' if is_fk else '#334155')
            ax.text(x + 1.5, y_pos, f, ha='left', va='center', fontsize=7.8, fontweight=('bold' if is_pk or is_fk else 'normal'), color=col)
            y_pos -= line_h
            
        return y, h

    # 1. rework_cases (9 fields -> h ~ 30.5)
    y_case, h_case = draw_entity(4, 55, 32, "rework_cases", [
        "PK  id : uuid",
        "    case_id : varchar (Unique)",
        "    source : varchar (SFC/Cust)",
        "    status : varchar (Auto)",
        "    target_date : date",
        "    completed_date : date",
        "    resolution_method : text",
        "    created_at : timestamp",
        "FK  created_by : uuid"
    ], bg_hdr='#1E3A8A', border='#3B82F6')

    # 2. rework_items (14 fields -> h ~ 43.0)
    y_item, h_item = draw_entity(44, 51, 35, "rework_items", [
        "PK  id : uuid",
        "FK  case_id : uuid (1:N)",
        "    item_code : varchar",
        "    item_number : varchar",
        "    amount : integer",
        "    completed_boxes : integer",
        "    batch_no : varchar",
        "    gallon_date : date",
        "    box_number : integer",
        "    mold : varchar",
        "    line : varchar",
        "FK  linked_source_id : uuid (Self)",
        "    defect_type : varchar",
        "    image_urls : text[]"
    ], bg_hdr='#1E3A8A', border='#3B82F6')

    # 3. rework_master_items (8 fields -> h ~ 28.0)
    y_mast, h_mast = draw_entity(87, 60, 29, "rework_master_items", [
        "PK  id : uuid",
        "    item_code : varchar (Unique)",
        "    item_number : varchar",
        "    part_name : text",
        "    oil_group : varchar",
        "    pallet_type : varchar",
        "    boxes_per_pallet : varchar",
        "    shelf_life : varchar"
    ], bg_hdr='#065F46', border='#10B981')

    # 4. drawings (7 fields -> h ~ 25.5)
    y_draw, h_draw = draw_entity(4, 12, 32, "drawings", [
        "PK  id : uuid",
        "    document_type : varchar",
        "    drawing_number : varchar",
        "    revision : varchar",
        "    pdf_url : text",
        "    customer_name : varchar",
        "    extracted_metadata : jsonb"
    ], bg_hdr='#854D0E', border='#EAB308')

    # 5. rag_documents (6 fields -> h ~ 23.0)
    y_rag, h_rag = draw_entity(44, 14, 30, "rag_documents", [
        "PK  id : uuid",
        "    title : text",
        "    doc_type : varchar",
        "    file_url : text",
        "    total_pages : integer",
        "    status : varchar"
    ], bg_hdr='#581C87', border='#A855F7')

    # 6. rag_document_chunks (7 fields -> h ~ 25.5)
    y_chunk, h_chunk = draw_entity(81, 12, 35, "rag_document_chunks", [
        "PK  id : uuid",
        "FK  document_id : uuid (1:N)",
        "    chunk_index : integer",
        "    content : text",
        "    page_number : integer",
        "    embedding : vector(768)",
        "    created_at : timestamp"
    ], bg_hdr='#581C87', border='#A855F7')

    # Relationship connectors
    # Case -> Item (1 : N)
    mid_case_y = y_case + h_case * 0.72
    ax.annotate('', xy=(44, mid_case_y), xytext=(36, mid_case_y), arrowprops=dict(arrowstyle="->", lw=2, color='#1E40AF'))
    ax.text(40, mid_case_y + 1.8, "1 : N", ha='center', va='center', fontsize=9, fontweight='bold', color='#1E40AF')

    # Item <-> Master (Autofill)
    mid_item_y = y_item + h_item * 0.75
    ax.annotate('', xy=(87, mid_item_y), xytext=(79, mid_item_y), arrowprops=dict(arrowstyle="<->", lw=1.6, color='#047857', linestyle='--'))
    ax.text(83, mid_item_y + 1.8, "Autofill", ha='center', va='center', fontsize=8.5, fontweight='bold', color='#047857')

    # Item Self-Ref (linked_source_id)
    arc_start_y = y_item + 14
    arc_end_y = y_item + 7
    ax.annotate('', xy=(79, arc_end_y), xytext=(79, arc_start_y), arrowprops=dict(arrowstyle="->", lw=1.6, color='#B91C1C', connectionstyle="arc3,rad=-0.8"))
    ax.text(84.2, (arc_start_y + arc_end_y)/2, "Linked\nDefect", ha='center', va='center', fontsize=7.5, fontweight='bold', color='#B91C1C')

    # rag_documents -> rag_document_chunks (1 : N)
    mid_rag_y = y_rag + h_rag * 0.55
    ax.annotate('', xy=(81, mid_rag_y), xytext=(74, mid_rag_y), arrowprops=dict(arrowstyle="->", lw=2, color='#7E22CE'))
    ax.text(77.5, mid_rag_y + 1.8, "1 : N", ha='center', va='center', fontsize=9, fontweight='bold', color='#7E22CE')

    plt.tight_layout()
    output_path = r"c:\Workplace\Mytask\Projects\QSMS_project\assets\erd_diagram.png"
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Refined ERD diagram saved at: {output_path}")

if __name__ == '__main__':
    create_system_architecture_diagram()
    create_erd_diagram()

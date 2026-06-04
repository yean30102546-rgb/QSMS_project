# Title: Prevent Text Clipping in Tailwind UI and PDF Export
[Updated: 2024-06-04]

## 1. Summary & Current Implementation
When rendering long text strings without spaces (like URLs or technical specs), they can clip outside their containers in Tailwind and when exported to PDF. To fix this, we strictly enforce word breaking styles on detail fields.

## 2. Technical Code Snippet (Best Practice)
For regular Tailwind components (`UpdateModal`, `CaseListTable`):
```tsx
<p className="whitespace-pre-wrap break-words whitespace-normal text-sm">
  {item.details}
</p>
```
Avoid using `truncate` on small containers unless `max-w` is sufficiently large or strictly enforced. Use `break-words` instead.

For HTML-to-PDF export templates (`ExportTemplate.tsx`):
```tsx
<p style={{ 
  whiteSpace: 'pre-wrap', 
  wordBreak: 'break-word', 
  overflowWrap: 'break-word' 
}}>
  {item.details}
</p>
```

## 3. Knowledge Relationships
- Depends On (must read): [[components/index.md]]
- Impacted By (changes affect): [[nextjs-frontend/ui-guidelines.md]]

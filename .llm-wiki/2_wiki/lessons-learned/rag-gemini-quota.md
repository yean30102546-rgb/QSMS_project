# Title: RAG Ingestion & Gemini Quota Learnings
[Updated: 2026-05-28]

## 1. Summary & Current Implementation
During the implementation of the QSMS DocAI RAG system, we encountered multiple issues related to payload formatting, file parsing, and API quotas when using the Google Gen AI SDK. The current implementation standardizes Excel parsing on the server (via `xlsx`), uses precise `Part` array structures for PDF multimodal payloads, and employs the `Gemma 4 26B` model to bypass restrictive daily quotas.

## 2. Key Learnings & Error Solutions

### 1. Excel Unsupported MIME Type Error
- **Error**: `{"error":{"code":400,"message":"Unsupported MIME type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","status":"INVALID_ARGUMENT"}}`
- **Cause**: The Gemini API natively rejects raw `.xlsx` files passed via `inlineData`.
- **Solution**: Instead of passing the file to Gemini, we use the `xlsx` (SheetJS) library server-side to parse the buffer into a Markdown/CSV string, then chunk and embed the text directly.

### 2. PDF Invalid Argument Error
- **Error**: `{"error":{"code":400,"message":"Request contains an invalid argument.","status":"INVALID_ARGUMENT"}}`
- **Cause**: Mixing raw strings and `inlineData` objects inside the `contents` array for `generateContent` causes SDK validation failures.
- **Solution**: Ensure all elements in the `contents` array are wrapped as explicit `Part` objects:
  ```ts
  contents: [
    { inlineData: { mimeType, data: base64Data } },
    { text: parsePrompt } // MUST be wrapped in { text: ... }
  ]
  ```

### 3. API Quota Limits (RESOURCE_EXHAUSTED)
- **Error**: `429 You exceeded your current quota...`
- **Cause**: Using the free tier for `gemini-1.5-flash` or `gemini-2.5-flash` enforces extremely strict limits (e.g., 5 RPM, 20 RPD). Batching document chunks rapidly exhausts this limit.
- **Solution**: 
  - Add explicit error handling for `429` to return a friendly "โทเคนลิมิตเต็ม" message.
  - **Model Swap**: Switch to `gemma-4-26b-a4b-it` (Gemma 4 26B) which offers a much higher Request Per Day limit (1,500 RPD) and supports PDF ingestion perfectly.

### 4. Markdown Formatting Spillage
- **Issue**: The AI natively formats lists and bold text using markdown asterisks (`*` and `**`), which leaked into the UI as raw symbols.
- **Solution**: Update the system prompt with strict instructions: `DO NOT use markdown asterisks (* or **) for text formatting (like bolding or bullet points). Use plain text, numbers, or dashes (-) instead.`

## 3. Knowledge Relationships
- Depends On (must read): [[../architecture/multimodal-rag.md]]
- Impacted By (changes affect): `/api/rag/route.ts`

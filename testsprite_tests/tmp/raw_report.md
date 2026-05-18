
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** QSMS Rework Web app
- **Date:** 2026-05-18
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 QSMS user creates a Rework case with multiple items
- **Test Code:** [TC001_QSMS_user_creates_a_Rework_case_with_multiple_items.py](./TC001_QSMS_user_creates_a_Rework_case_with_multiple_items.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bc44a823-636d-43ae-82ff-b4574a08afec/20f1ab7d-e3da-46e3-b1b1-52098369357e
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 QSMS user logs in and sees all permitted areas
- **Test Code:** [TC002_QSMS_user_logs_in_and_sees_all_permitted_areas.py](./TC002_QSMS_user_logs_in_and_sees_all_permitted_areas.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bc44a823-636d-43ae-82ff-b4574a08afec/1fb6f39d-f613-49b4-b2e1-205b77fd53a2
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 WFG user logs in and sees allowed navigation
- **Test Code:** [TC003_WFG_user_logs_in_and_sees_allowed_navigation.py](./TC003_WFG_user_logs_in_and_sees_allowed_navigation.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bc44a823-636d-43ae-82ff-b4574a08afec/0241f204-6d73-45c6-bd1f-4c714e4015e9
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004 Finance user logs in and sees only Overall
- **Test Code:** [TC004_Finance_user_logs_in_and_sees_only_Overall.py](./TC004_Finance_user_logs_in_and_sees_only_Overall.py)
- **Test Error:** TEST FAILURE

Logging in with the Finance profile and PIN '123456' did not work — the app did not navigate to the main application after submitting the credentials.

Observations:
- The login form displayed 'Invalid profile or password'.
- The page remained on the login screen and the submit button was disabled.
- The username field contained 'FINANCE' but authentication was not accepted.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bc44a823-636d-43ae-82ff-b4574a08afec/5dadfd1d-9102-4890-a84a-bea7a0eaf65c
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005 WFG user creates and reviews a Rework case
- **Test Code:** [TC005_WFG_user_creates_and_reviews_a_Rework_case.py](./TC005_WFG_user_creates_and_reviews_a_Rework_case.py)
- **Test Error:** TEST FAILURE

The Rework case could not be submitted — the Save button remained disabled even after all required fields were completed and the item was added to the case list.

Observations:
- The 'บันทึกข้อมูลเข้าสู่ระบบ' (Save) button is disabled (disabled=true) on the Add Case page.
- The form shows filled values: Customer=Eneos; Item Number=60001234A; Item Name=Bottle Plastic 250ml; Item Code=40001234; Batch no.=240510; Packaging Date=2024-05-10; Amount=1; Cause=เปื้อน with format=ขวดเปื้อน; Responsible=SFC; and the UI shows an added item (รายการที่ 2).

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bc44a823-636d-43ae-82ff-b4574a08afec/6473b01f-086b-4947-a6ab-791dd2175917
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006 User reviews existing Rework cases in Overall
- **Test Code:** [TC006_User_reviews_existing_Rework_cases_in_Overall.py](./TC006_User_reviews_existing_Rework_cases_in_Overall.py)
- **Test Error:** TEST FAILURE

No Rework cases were available to review in the Overall view — the expected existing case list and non-empty summary data were not found.

Observations:
- The Overall page displays the message 'ไม่พบรายการงาน Rework ในขณะนี้' (no Rework items found).
- The summary cards at the top show 0 for all statuses (จำนวนงานทั้งหมด, รอดำเนินการ, กำลังดำเนินการ, รอประเมินราคา, เสร็จสิ้น).

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bc44a823-636d-43ae-82ff-b4574a08afec/a7d93ce8-fbd2-4169-b22f-81efbb29b814
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007 Finance user cannot access restricted tabs
- **Test Code:** [TC007_Finance_user_cannot_access_restricted_tabs.py](./TC007_Finance_user_cannot_access_restricted_tabs.py)
- **Test Error:** TEST BLOCKED

The test could not be run — a valid FINANCE 6-digit PIN is not available, so login and subsequent verification of accessible tabs could not be completed.

Observations:
- The login page displayed 'Invalid profile or password'.
- The password field is empty and the submit button is disabled.
- No FINANCE PIN was provided in the task Extra Info, and past attempts using PIN '123456' failed.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bc44a823-636d-43ae-82ff-b4574a08afec/d4b9e0a8-db9c-49f4-bafd-647805785207
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 User is blocked by an incorrect PIN
- **Test Code:** [TC008_User_is_blocked_by_an_incorrect_PIN.py](./TC008_User_is_blocked_by_an_incorrect_PIN.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bc44a823-636d-43ae-82ff-b4574a08afec/4c93c58d-7aed-4ee3-a3ad-ffb39c6b04f3
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009 User sees validation when Batch No. is invalid
- **Test Code:** [TC009_User_sees_validation_when_Batch_No._is_invalid.py](./TC009_User_sees_validation_when_Batch_No._is_invalid.py)
- **Test Error:** TEST BLOCKED

The test could not be run — the Add Case form could not be submitted because the Save button is disabled until other required fields are filled.

Observations:
- The 'บันทึกข้อมูลเข้าสู่ระบบ' (Save) button is disabled (index 526).
- Several required selects (Source, Customer Name, Cause, Responsible) remain at the default 'กรุณาเลือก'.
- No validation message for Batch No. is visible on the page, and the form remains open.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bc44a823-636d-43ae-82ff-b4574a08afec/48a33a20-34ee-4340-90ec-f192171aafda
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 User is blocked by an invalid profile selection
- **Test Code:** [TC010_User_is_blocked_by_an_invalid_profile_selection.py](./TC010_User_is_blocked_by_an_invalid_profile_selection.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/bc44a823-636d-43ae-82ff-b4574a08afec/6e80fcd6-ad92-4366-b636-561eaf1e654b
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **50.00** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---
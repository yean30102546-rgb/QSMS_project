const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('src/modules/storage/components/DocumentList.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Update row clicks & add id
content = content.replace(/onClick=\{\(\) => setSelectedInspectionDoc\(doc\)\}/g, 
  "onClick={() => setSelectedInspectionDoc(prev => prev?.id === doc.id ? null : doc)}\n                        id={`doc-row-${doc.id}`}");

// 2. Update handleTabChange
const oldHandleTabChange = `  const handleTabChange = (newTab: 'drawing' | 'master' | 'link') => {
    if (newTab !== activeTab) {
      setPage(1);
      setActiveTab(newTab);
    }
  };`;
const newHandleTabChange = `  const handleTabChange = (newTab: 'drawing' | 'master' | 'link') => {
    if (newTab !== activeTab) {
      setPage(1);
      setActiveTab(newTab);
      setSelectedInspectionDoc(null); // Auto-close inspection panel on tab switch
    }
  };`;
content = content.replace(oldHandleTabChange, newHandleTabChange);

// 3. Update handleKeyDown and add scroll effect
const oldKeyDownSection = `  // Keyboard Navigation listener for Inspection Panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(targetTag)) return;

      if (!selectedInspectionDoc) return;

      if (e.key === 'Escape') {`;

const newKeyDownSection = `  // Keyboard Navigation listener for Inspection Panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(targetTag)) return;

      // Spacebar to Quick Peek or Toggle
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (selectedInspectionDoc) {
          setSelectedInspectionDoc(null);
        } else {
          const currentList = activeTab === 'drawing' ? filteredDrawings : activeTab === 'master' ? filteredMasters : [];
          if (currentList.length > 0) {
            setSelectedInspectionDoc(currentList[0]);
          }
        }
        return;
      }

      if (!selectedInspectionDoc) return;

      if (e.key === 'Escape') {`;
content = content.replace(oldKeyDownSection, newKeyDownSection);

// 4. Add scroll effect right after the keydown useEffect
const keydownEffectRegex = /  \}, \[selectedInspectionDoc, filteredDrawings, filteredMasters, documents, activeTab\]\);\n/g;

const scrollEffectCode = `  }, [selectedInspectionDoc, filteredDrawings, filteredMasters, documents, activeTab]);

  // Auto-scroll selected row into view
  useEffect(() => {
    if (selectedInspectionDoc) {
      const row = document.getElementById(\`doc-row-\${selectedInspectionDoc.id}\`);
      if (row) {
        row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedInspectionDoc]);
`;

content = content.replace(keydownEffectRegex, scrollEffectCode);

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Script ran successfully');

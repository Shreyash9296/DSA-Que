import { useState, useEffect, useRef } from 'react';

function UserGuide() {
  const [htmlContent, setHtmlContent] = useState('');
  const [tableOfContents, setTableOfContents] = useState([]);
  const [expandedSections, setExpandedSections] = useState({});
  const [activeSection, setActiveSection] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedImage, setExpandedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef(null);

  useEffect(() => {
    loadDocumentContent();
  }, []);

  useEffect(() => {
    if (tableOfContents.length > 0) {
      const initialExpanded = {};
      tableOfContents.forEach(section => {
        if (section.level === 1) {
          initialExpanded[section.id] = true;
        }
      });
      setExpandedSections(initialExpanded);
      
      if (tableOfContents[0]) {
        setActiveSection(tableOfContents[0].id);
      }
    }
  }, [tableOfContents]);

  const extractTableOfContentsFromHTML = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const toc = [];
    const tocMap = new Map();
    
    // Find all paragraphs and headings in the document
    const allElements = doc.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
    
    // Pattern to match numbered sections like "1. Introduction" or "1.1. Background"
    const sectionPattern = /^(\d+(?:\.\d+)*)\.\s+(.+)$/;
    
    let contentsEnded = false;
    let contentsStarted = false;
    
    allElements.forEach((element) => {
      const text = element.textContent.trim();
      
      // Check if this is the "Contents" heading
      if (/^Contents?$/i.test(text)) {
        contentsStarted = true;
        return;
      }
      
      // If we haven't found contents yet and we see section 1, mark contents as ended
      if (!contentsEnded && /^1\.\s+[A-Z]/.test(text)) {
        contentsEnded = true;
      }
      
      const match = text.match(sectionPattern);
      
      if (match) {
        const number = match[1];
        let title = match[2].trim();
        
        // Remove page numbers from the end (e.g., "Introduction 4" -> "Introduction")
        title = title.replace(/\s+\d+$/, '').trim();
        
        // Skip if title is empty after cleanup
        if (!title) return;
        
        // Determine level based on dots in number
        const level = number.split('.').length;
        
        // Only include up to level 2 (1.1, 1.2, etc.)
        if (level > 2) return;
        
        const id = `section-${number.replace(/\./g, '-')}`;
        
        const entry = {
          id,
          number,
          title,
          level,
          element: element.cloneNode(true)
        };
        
        tocMap.set(id, entry);
        
        if (level === 1) {
          toc.push({
            ...entry,
            children: []
          });
        } else if (level === 2 && toc.length > 0) {
          toc[toc.length - 1].children.push(entry);
        }
      }
    });
    
    console.log('Extracted TOC:', toc);
    return toc;
  };

  const processHtmlContent = (html, toc) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Remove the entire Contents section
    let contentsFound = false;
    let firstSectionFound = false;
    const elementsToRemove = [];
    
    const allElements = doc.body.querySelectorAll('*');
    
    allElements.forEach((element) => {
      const text = element.textContent.trim();
      
      // Mark when we find "Contents"
      if (/^Contents?$/i.test(text)) {
        contentsFound = true;
        elementsToRemove.push(element);
        return;
      }
      
      // If we're in contents section, mark elements for removal
      if (contentsFound && !firstSectionFound) {
        // Check if this is the start of actual content (section 1)
        if (/^1\.\s+[A-Z]/.test(text) && !text.match(/\s+\d+$/)) {
          firstSectionFound = true;
        } else {
          elementsToRemove.push(element);
        }
      }
    });
    
    // Remove marked elements
    elementsToRemove.forEach(el => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
    
    // Now inject section IDs into the actual content sections
    const bodyElements = doc.body.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
    
    toc.forEach(section => {
      const pattern = new RegExp(`^${section.number}\\.\\s+${section.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
      
      bodyElements.forEach(element => {
        const text = element.textContent.trim();
        if (pattern.test(text)) {
          const wrapper = doc.createElement('div');
          wrapper.id = section.id;
          wrapper.className = 'section-marker';
          
          const heading = doc.createElement('h2');
          heading.className = 'section-heading';
          heading.textContent = `${section.number}. ${section.title}`;
          
          wrapper.appendChild(heading);
          
          if (element.parentNode) {
            element.parentNode.replaceChild(wrapper, element);
          }
        }
      });
      
      // Process children
      if (section.children && section.children.length > 0) {
        section.children.forEach(child => {
          const childPattern = new RegExp(`^${child.number}\\.\\s+${child.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
          
          bodyElements.forEach(element => {
            const text = element.textContent.trim();
            if (childPattern.test(text)) {
              const wrapper = doc.createElement('div');
              wrapper.id = child.id;
              wrapper.className = 'section-marker subsection-marker';
              
              const heading = doc.createElement('h3');
              heading.className = 'subsection-heading';
              heading.textContent = `${child.number}. ${child.title}`;
              
              wrapper.appendChild(heading);
              
              if (element.parentNode) {
                element.parentNode.replaceChild(wrapper, element);
              }
            }
          });
        });
      }
    });
    
    // Enhanced table styling
    doc.querySelectorAll('table').forEach(table => {
      table.className = 'doc-table';
    });
    
    doc.querySelectorAll('th').forEach(th => {
      th.className = 'doc-th';
    });
    
    doc.querySelectorAll('td').forEach(td => {
      td.className = 'doc-td';
    });
    
    // Process images
    doc.querySelectorAll('img').forEach(img => {
      img.className = 'doc-image';
      img.setAttribute('onclick', 'window.handleImageClick(this)');
    });
    
    return doc.body.innerHTML;
  };

  const loadDocumentContent = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/docx');
      if (!res.ok) throw new Error('Failed to load document');
      
      let html = await res.text();
      
      // Extract table of contents from the HTML
      const toc = extractTableOfContentsFromHTML(html);
      setTableOfContents(toc);
      
      // Process HTML content
      html = processHtmlContent(html, toc);
      
      setHtmlContent(html);
      setLoading(false);
    } catch (error) {
      console.error('Error loading document:', error);
      setHtmlContent('<div class="p-8 text-red-600">Error loading document. Please refresh the page.</div>');
      setLoading(false);
    }
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleSectionClick = (sectionId) => {
    setActiveSection(sectionId);
    
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element && contentRef.current) {
        const yOffset = -20;
        const elementTop = element.offsetTop;
        contentRef.current.scrollTo({ 
          top: elementTop + yOffset, 
          behavior: 'smooth' 
        });
      }
    }, 100);
  };

  const filterSections = (sections, query) => {
    if (!query) return sections;
    
    const lowerQuery = query.toLowerCase();
    return sections.map(section => {
      const matchesParent = 
        section.title.toLowerCase().includes(lowerQuery) ||
        section.number.includes(lowerQuery);
      
      const filteredChildren = section.children?.filter(child =>
        child.title.toLowerCase().includes(lowerQuery) ||
        child.number.includes(lowerQuery)
      ) || [];

      if (matchesParent || filteredChildren.length > 0) {
        return { ...section, children: filteredChildren };
      }
      return null;
    }).filter(Boolean);
  };

  useEffect(() => {
    window.handleImageClick = (img) => {
      setExpandedImage(img.src);
    };
    return () => {
      delete window.handleImageClick;
    };
  }, []);

  const filteredNav = filterSections(tableOfContents, searchQuery);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#DB0011' }}></div>
          <p className="text-gray-600">Loading User Guide...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-50 h-14 flex items-center px-6 shadow-sm" style={{ backgroundColor: 'rgb(29, 38, 44)' }}>
        <h1 className="text-white text-lg font-semibold tracking-wide">User Guide</h1>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 border-r overflow-y-auto" style={{ backgroundColor: '#fafafa', borderColor: '#e5e7eb' }}>
          <div className="p-4 border-b" style={{ borderColor: '#e5e7eb' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sections..."
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 transition-all"
              style={{ borderColor: '#d1d5db' }}
            />
          </div>

          <nav className="p-3">
            {filteredNav.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-8">
                {tableOfContents.length === 0 ? 'Extracting sections...' : 'No sections found'}
              </div>
            ) : (
              filteredNav.map(section => (
                <div key={section.id} className="mb-1">
                  <button
                    onClick={() => {
                      handleSectionClick(section.id);
                      toggleSection(section.id);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-all text-sm font-medium"
                    style={{
                      backgroundColor: activeSection === section.id ? '#ffebee' : 'transparent',
                      color: activeSection === section.id ? '#DB0011' : '#374151',
                    }}
                  >
                    <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-xs transition-transform" style={{ transform: expandedSections[section.id] ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                      ▶
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ backgroundColor: '#DB0011', color: 'white' }}>
                      {section.number}
                    </span>
                    <span className="flex-1 truncate">{section.title}</span>
                  </button>

                  {expandedSections[section.id] && section.children?.length > 0 && (
                    <div className="ml-7 mt-1 space-y-0.5">
                      {section.children.map(child => (
                        <button
                          key={child.id}
                          onClick={() => handleSectionClick(child.id)}
                          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-left transition-all text-sm"
                          style={{
                            backgroundColor: activeSection === child.id ? '#fff5f5' : 'transparent',
                            color: activeSection === child.id ? '#DB0011' : '#6b7280',
                          }}
                        >
                          <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: '#f3f4f6', color: '#4b5563' }}>
                            {child.number}
                          </span>
                          <span className="flex-1 truncate">{child.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </nav>
        </aside>

        <main ref={contentRef} className="flex-1 overflow-y-auto bg-white">
          <article className="max-w-5xl mx-auto px-8 py-8">
            <style>{`
              .doc-content {
                font-family: 'Times New Roman', Times, serif;
                font-size: 16px;
                line-height: 1.8;
                color: #1f2937;
              }
              
              .doc-content .section-marker {
                margin-top: 48px;
                margin-bottom: 24px;
                scroll-margin-top: 20px;
              }
              
              .doc-content .subsection-marker {
                margin-top: 32px;
                margin-bottom: 16px;
                scroll-margin-top: 20px;
              }
              
              .doc-content .section-heading {
                font-size: 24px;
                font-weight: bold;
                color: rgb(29, 38, 44);
                margin-bottom: 16px;
                padding-bottom: 8px;
                border-bottom: 2px solid #DB0011;
              }
              
              .doc-content .subsection-heading {
                font-size: 20px;
                font-weight: bold;
                color: #374151;
                margin-bottom: 12px;
              }
              
              .doc-content p {
                margin-bottom: 12px;
                text-align: justify;
              }
              
              .doc-content ul, .doc-content ol {
                margin-left: 24px;
                margin-bottom: 12px;
              }
              
              .doc-content li {
                margin-bottom: 6px;
              }
              
              .doc-content .doc-table {
                width: 100%;
                border-collapse: collapse;
                margin: 24px 0;
                font-size: 14px;
              }
              
              .doc-content .doc-th {
                background-color: rgb(29, 38, 44);
                color: white;
                padding: 12px;
                text-align: left;
                font-weight: 600;
                border: 1px solid #d1d5db;
              }
              
              .doc-content .doc-td {
                padding: 10px 12px;
                border: 1px solid #d1d5db;
              }
              
              .doc-content tr:nth-child(even) {
                background-color: #f9fafb;
              }
              
              .doc-content .doc-image {
                max-width: 600px;
                height: auto;
                margin: 24px 0;
                border: 1px solid #e5e7eb;
                border-radius: 4px;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
              }
              
              .doc-content .doc-image:hover {
                transform: scale(1.02);
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              }
              
              .doc-content code {
                background-color: #f3f4f6;
                padding: 2px 6px;
                border-radius: 3px;
                font-family: 'Courier New', monospace;
                font-size: 14px;
              }
              
              .doc-content pre {
                background-color: #1f2937;
                color: #f3f4f6;
                padding: 16px;
                border-radius: 6px;
                overflow-x: auto;
                margin: 16px 0;
              }
            `}</style>
            
            <div 
              className="doc-content"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </article>
        </main>
      </div>

      {expandedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative max-w-7xl max-h-full">
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute -top-12 right-0 text-white text-lg font-bold px-4 py-2 rounded hover:bg-white hover:bg-opacity-20 transition-all"
            >
              ✕ Close
            </button>
            <img 
              src={expandedImage} 
              alt="Expanded view"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default UserGuide;

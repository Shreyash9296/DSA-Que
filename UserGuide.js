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
    // Initialize all parent sections as expanded when TOC is loaded
    if (tableOfContents.length > 0) {
      const initialExpanded = {};
      tableOfContents.forEach(section => {
        if (section.level === 1) {
          initialExpanded[section.id] = true;
        }
      });
      setExpandedSections(initialExpanded);
      
      // Set first section as active
      if (tableOfContents[0]) {
        setActiveSection(tableOfContents[0].id);
      }
    }
  }, [tableOfContents]);

  const extractTableOfContents = (html) => {
    const toc = [];
    
    // Find the Contents section - look for patterns like "Contents" heading followed by numbered entries
    const contentsRegex = /Contents[\s\S]*?(?=<h[1-6]|<p[^>]*>\s*\d+\.\s+[A-Z])/i;
    const contentsMatch = html.match(contentsRegex);
    
    if (!contentsMatch) {
      // Fallback: try to extract from numbered paragraphs/headings throughout document
      return extractFromDocument(html);
    }

    const contentsSection = contentsMatch[0];
    
    // Extract entries like "1. Introduction 4" or "1.1. Background 4"
    const entryRegex = /(\d+(?:\.\d+)*)\.\s+([^\d\n]+?)\s+(\d+)/g;
    let match;
    
    while ((match = entryRegex.exec(contentsSection)) !== null) {
      const number = match[1];
      const title = match[2].trim();
      const pageNumber = match[3];
      
      // Determine level based on number of dots
      const level = number.split('.').length;
      const id = `section-${number.replace(/\./g, '-')}`;
      
      if (level === 1) {
        // Parent section
        toc.push({
          id,
          number,
          title,
          level,
          pageNumber,
          children: []
        });
      } else if (level === 2 && toc.length > 0) {
        // Child section - add to last parent
        toc[toc.length - 1].children.push({
          id,
          number,
          title,
          level,
          pageNumber
        });
      }
    }
    
    return toc;
  };

  const extractFromDocument = (html) => {
    // Fallback method: extract from document structure
    const toc = [];
    
    // Look for patterns like "<p>1. Introduction</p>" or "<h2>1. Introduction</h2>"
    const headingRegex = /<(?:h[1-6]|p)[^>]*>\s*(\d+(?:\.\d+)*)\.\s+([^<]+)<\/(?:h[1-6]|p)>/gi;
    let match;
    
    const entries = [];
    while ((match = headingRegex.exec(html)) !== null) {
      const number = match[1];
      const title = match[2].trim();
      const level = number.split('.').length;
      
      entries.push({
        number,
        title,
        level,
        id: `section-${number.replace(/\./g, '-')}`
      });
    }
    
    // Build hierarchy
    entries.forEach(entry => {
      if (entry.level === 1) {
        toc.push({
          ...entry,
          children: []
        });
      } else if (entry.level === 2 && toc.length > 0) {
        toc[toc.length - 1].children.push(entry);
      }
    });
    
    return toc;
  };

  const processHtmlContent = (html, toc) => {
    // Find and remove the entire Contents section (first 3 pages)
    // Look for "Contents" heading and remove everything until we hit the first main section
    const contentsStart = html.search(/<(?:h[1-6]|p)[^>]*>\s*Contents?\s*<\/(?:h[1-6]|p)>/i);
    
    if (contentsStart !== -1) {
      // Find where the actual content starts (first numbered section like "1. Introduction")
      const firstSectionPattern = /<(?:h[1-6]|p)[^>]*>\s*1\.\s+[A-Z][a-z]+/i;
      const firstSectionStart = html.substring(contentsStart).search(firstSectionPattern);
      
      if (firstSectionStart !== -1) {
        // Remove everything from "Contents" to just before first section
        html = html.substring(0, contentsStart) + html.substring(contentsStart + firstSectionStart);
      }
    }
    
    // Remove any remaining TOC entries that might be scattered
    // Pattern: "1. Introduction 4" or "1.1. Background 4" (number at end is page number)
    html = html.replace(/<p[^>]*>\s*\d+(?:\.\d+)*\.\s+[^<]+?\s+\d+\s*<\/p>/g, '');
    
    // Also remove lines that are just section numbers with titles and page numbers in italic
    html = html.replace(/<p[^>]*><(?:i|em)[^>]*>\s*\d+(?:\.\d+)*\.\s+[^<]+?\s+\d+\s*<\/(?:i|em)><\/p>/g, '');
    
    // Remove standalone "Contents" heading if still present
    html = html.replace(/<(?:h[1-6]|p)[^>]*>\s*Contents?\s*<\/(?:h[1-6]|p)>/gi, '');

    // Inject section markers based on extracted TOC
    toc.forEach(section => {
      // Create more flexible pattern to match section headings in actual content
      // Important: Only match headings that appear AFTER the Contents section
      const patterns = [
        // Pattern 1: Exact match with heading tags
        new RegExp(`<(h[1-6])[^>]*>\\s*${section.number}\\.?\\s+${escapeRegex(section.title)}\\s*</\\1>`, 'gi'),
        // Pattern 2: Match in paragraph that looks like a heading (bold, larger text)
        new RegExp(`<p[^>]*>\\s*<(?:b|strong)[^>]*>\\s*${section.number}\\.?\\s+${escapeRegex(section.title)}\\s*</(?:b|strong)>\\s*</p>`, 'gi'),
        // Pattern 3: Plain paragraph format
        new RegExp(`<p[^>]*>\\s*${section.number}\\.?\\s+${escapeRegex(section.title)}\\s*</p>`, 'gi')
      ];
      
      let replaced = false;
      for (const pattern of patterns) {
        const newHtml = html.replace(pattern, (match) => {
          // Make sure this isn't in the Contents section we're trying to remove
          if (!replaced) {
            replaced = true;
            return `<div id="${section.id}" class="section-marker"><h2 class="section-heading">${section.number}. ${section.title}</h2></div>`;
          }
          return ''; // Remove duplicate occurrences
        });
        if (newHtml !== html) {
          html = newHtml;
          break;
        }
      }

      // Process children
      if (section.children && section.children.length > 0) {
        section.children.forEach(child => {
          const childPatterns = [
            new RegExp(`<(h[1-6])[^>]*>\\s*${child.number}\\.?\\s+${escapeRegex(child.title)}\\s*</\\1>`, 'gi'),
            new RegExp(`<p[^>]*>\\s*<(?:b|strong)[^>]*>\\s*${child.number}\\.?\\s+${escapeRegex(child.title)}\\s*</(?:b|strong)>\\s*</p>`, 'gi'),
            new RegExp(`<p[^>]*>\\s*${child.number}\\.?\\s+${escapeRegex(child.title)}\\s*</p>`, 'gi')
          ];
          
          let childReplaced = false;
          for (const pattern of childPatterns) {
            const newHtml = html.replace(pattern, (match) => {
              if (!childReplaced) {
                childReplaced = true;
                return `<div id="${child.id}" class="section-marker subsection-marker"><h3 class="subsection-heading">${child.number}. ${child.title}</h3></div>`;
              }
              return ''; // Remove duplicate occurrences
            });
            if (newHtml !== html) {
              html = newHtml;
              break;
            }
          }
        });
      }
    });

    // Enhanced table styling
    html = html.replace(/<table/g, '<table class="doc-table"');
    html = html.replace(/<th/g, '<th class="doc-th"');
    html = html.replace(/<td/g, '<td class="doc-td"');

    // Process images - add click handlers
    html = html.replace(/<img([^>]*)>/g, '<img$1 class="doc-image" onclick="window.handleImageClick(this)" />');

    return html;
  };

  const escapeRegex = (str) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const loadDocumentContent = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/docx');
      if (!res.ok) throw new Error('Failed to load document');
      
      let html = await res.text();
      
      // First, extract table of contents
      const toc = extractTableOfContents(html);
      console.log('Extracted TOC:', toc);
      setTableOfContents(toc);
      
      // Then process HTML content with the TOC
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

  const handleSectionClick = (sectionId, isChild = false) => {
    setActiveSection(sectionId);
    
    // Scroll to section
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element && contentRef.current) {
        const yOffset = -80;
        const y = element.getBoundingClientRect().top + contentRef.current.scrollTop;
        contentRef.current.scrollTo({ top: y + yOffset, behavior: 'smooth' });
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

  // Make image click handler available globally
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
      {/* Header */}
      <header className="sticky top-0 z-50 h-14 flex items-center px-6 shadow-sm" style={{ backgroundColor: 'rgb(29, 38, 44)' }}>
        <h1 className="text-white text-lg font-semibold tracking-wide">User Guide</h1>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-80 border-r overflow-y-auto" style={{ backgroundColor: '#fafafa', borderColor: '#e5e7eb' }}>
          <div className="p-4 border-b" style={{ borderColor: '#e5e7eb' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sections..."
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 transition-all"
              style={{ 
                borderColor: '#d1d5db'
              }}
            />
          </div>

          <nav className="p-3">
            {filteredNav.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-8">
                No sections found
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
                    <span className="flex-1">{section.title}</span>
                  </button>

                  {expandedSections[section.id] && section.children?.length > 0 && (
                    <div className="ml-7 mt-1 space-y-0.5">
                      {section.children.map(child => (
                        <button
                          key={child.id}
                          onClick={() => handleSectionClick(child.id, true)}
                          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-left transition-all text-sm"
                          style={{
                            backgroundColor: activeSection === child.id ? '#fff5f5' : 'transparent',
                            color: activeSection === child.id ? '#DB0011' : '#6b7280',
                          }}
                        >
                          <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ backgroundColor: '#f3f4f6', color: '#4b5563' }}>
                            {child.number}
                          </span>
                          <span className="flex-1">{child.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </nav>
        </aside>

        {/* Main Content */}
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
              }
              
              .doc-content .subsection-marker {
                margin-top: 32px;
                margin-bottom: 16px;
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

      {/* Image Modal */}
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

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
    const seenIds = new Set();
    
    // Find all anchor tags with href starting with #
    const links = doc.querySelectorAll('a[href^="#"]');
    
    console.log('Total links found:', links.length);
    
    links.forEach((link, index) => {
      const text = link.textContent.trim();
      const href = link.getAttribute('href');
      
      if (!href || href === '#') return;
      
      // Remove the # to get the ID
      const targetId = href.substring(1);
      
      console.log(`Link ${index}: "${text}" -> ID: "${targetId}"`);
      
      // Skip if we've already seen this ID
      if (seenIds.has(targetId)) {
        console.log(`  Skipping duplicate ID: ${targetId}`);
        return;
      }
      
      // Pattern: "1. Introduction" or "1.1. Background" (with or without page numbers)
      const match = text.match(/^(\d+(?:\.\d+)*)\.\s+(.+?)(?:\s+\d+)?$/);
      
      if (match) {
        const number = match[1];
        let title = match[2].trim();
        
        // Remove trailing page numbers if any
        title = title.replace(/\s+\d+$/, '').trim();
        
        const level = number.split('.').length;
        
        // Only process level 1 and 2
        if (level > 2) return;
        
        seenIds.add(targetId);
        
        const entry = {
          id: targetId,
          number,
          title,
          level
        };
        
        console.log(`  Added to TOC: ${number}. ${title} (ID: ${targetId})`);
        
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
    
    console.log('Final TOC:', toc);
    return toc;
  };

  const processHtmlContent = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Strategy: Find and hide the Contents section using CSS
    // This is more reliable than removing elements
    
    let contentsHeading = null;
    let firstContentSection = null;
    
    // Find the Contents heading and all links in it
    const allParagraphs = Array.from(doc.body.querySelectorAll('p, h1, h2, h3, h4, h5, h6'));
    
    let inContentsSection = false;
    const elementsToHide = [];
    
    for (let i = 0; i < allParagraphs.length; i++) {
      const element = allParagraphs[i];
      const text = element.textContent.trim();
      
      // Find "Contents" heading
      if (/^Contents?$/i.test(text) && text.length < 20 && !inContentsSection) {
        inContentsSection = true;
        elementsToHide.push(element);
        console.log('Found Contents heading');
        continue;
      }
      
      // If we're in Contents section
      if (inContentsSection) {
        // Check if this paragraph contains only a link (Contents entry)
        const links = element.querySelectorAll('a[href^="#"]');
        const hasOnlyLink = links.length > 0 && element.textContent.trim().match(/^\d+(\.\d+)*\./);
        
        // Check if this is actual content (has Toc ID directly on it, not in a link)
        const isActualContent = (element.id && element.id.startsWith('Toc')) || 
                               (element.id && element.id.startsWith('_Toc'));
        
        if (isActualContent) {
          console.log('Found first actual content section, stopping hiding');
          inContentsSection = false;
          break;
        } else if (hasOnlyLink) {
          // This is a Contents entry, hide it
          elementsToHide.push(element);
        }
      }
    }
    
    console.log(`Hiding ${elementsToHide.length} Contents elements`);
    
    // Hide the Contents elements using display: none
    elementsToHide.forEach(el => {
      el.style.display = 'none';
    });
    
    // Enhanced table styling
    doc.querySelectorAll('table').forEach(table => {
      table.classList.add('doc-table');
    });
    
    doc.querySelectorAll('th').forEach(th => {
      th.classList.add('doc-th');
    });
    
    doc.querySelectorAll('td').forEach(td => {
      td.classList.add('doc-td');
    });
    
    // Process images
    doc.querySelectorAll('img').forEach(img => {
      img.classList.add('doc-image');
      img.setAttribute('onclick', 'window.handleImageClick(this)');
    });
    
    // Add scroll margin to all elements with IDs (section targets)
    const elementsWithIds = doc.querySelectorAll('[id]');
    console.log('Total elements with IDs found:', elementsWithIds.length);
    
    elementsWithIds.forEach((el, index) => {
      el.style.scrollMarginTop = '20px';
      if (index < 10) {
        console.log(`Element ${index}: id="${el.id}", tag="${el.tagName}", text="${el.textContent.substring(0, 50)}..."`);
      }
    });
    
    return doc.body.innerHTML;
  };

  const loadDocumentContent = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/docx');
      if (!res.ok) throw new Error('Failed to load document');
      
      let html = await res.text();
      
      // First extract TOC from the links
      const toc = extractTableOfContentsFromHTML(html);
      setTableOfContents(toc);
      
      // Then process HTML to hide Contents section
      html = processHtmlContent(html);
      
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
    
    console.log(`Attempting to scroll to section: ${sectionId}`);
    
    setTimeout(() => {
      const contentArea = contentRef.current;
      if (!contentArea) {
        console.error('Content area ref not found');
        return;
      }
      
      // Find the element with this ID
      const element = document.getElementById(sectionId);
      
      if (!element) {
        console.error(`Element with id "${sectionId}" not found`);
        return;
      }
      
      console.log(`Found element: ${element.tagName}, parent: ${element.parentElement?.tagName}`);
      
      // The ID is on an <A> tag, but we need to scroll to its parent or the containing block
      let scrollTarget = element;
      
      // If it's an anchor tag, use its parent element (usually H1, H2, etc.)
      if (element.tagName === 'A') {
        scrollTarget = element.parentElement || element;
        console.log(`Using parent element for scroll: ${scrollTarget.tagName}`);
      }
      
      // Check if this element is inside the hidden Contents section
      let parent = scrollTarget;
      let isInHiddenSection = false;
      while (parent) {
        if (window.getComputedStyle(parent).display === 'none') {
          isInHiddenSection = true;
          console.log('Element is in hidden Contents section, looking for duplicate...');
          break;
        }
        parent = parent.parentElement;
      }
      
      // If in hidden section, find the visible heading with same text content
      if (isInHiddenSection) {
        const targetText = element.textContent.trim();
        const pattern = targetText.replace(/\s+/g, '\\s+').replace(/[.*+?^${}()|[\]\\]/g, '\\  const handleSectionClick = (sectionId) => {
    setActiveSection(sectionId);
    
    console.log(`Attempting to scroll to section: ${sectionId}`);
    
    setTimeout(() => {
      const contentArea = contentRef.current;
      if (!contentArea) {
        console.error('Content area ref not found');
        return;
      }
      
      // Find ALL elements with this ID
      const allElementsWithId = document.querySelectorAll(`[id="${sectionId}"]`);
      console.log(`Found ${allElementsWithId.length} elements with id="${sectionId}"`);
      
      // Find the one that's NOT an anchor tag (not a link)
      let targetElement = null;
      allElementsWithId.forEach((el, index) => {
        console.log(`  Element ${index}: ${el.tagName}, parent: ${el.parentElement?.tagName}, display: ${window.getComputedStyle(el).display}`);
        
        // We want the element that's NOT hidden and NOT an anchor inside a hidden element
        const isVisible = window.getComputedStyle(el).display !== 'none' &&
                         window.getComputedStyle(el.parentElement || el).display !== 'none';
        
        if (el.tagName !== 'A' && isVisible) {
          targetElement = el;
          console.log(`  -> Using this element for scrolling`);
        }
      });
      
      if (!targetElement && allElementsWithId.length > 0) {
        // Fallback: use the last one (likely the actual content, not the link)
        targetElement = allElementsWithId[allElementsWithId.length - 1];
        console.log('Using fallback: last element with this ID');
      }
      
      if (targetElement) {
        console.log(`Scrolling to: ${targetElement.tagName} - "${targetElement.textContent.substring(0, 50)}..."`);
        
        // Calculate scroll position
        const containerRect = contentArea.getBoundingClientRect();
        const elementRect = targetElement.getBoundingClientRect();
        const currentScroll = contentArea.scrollTop;
        const offset = 20;
        
        const scrollPosition = currentScroll + (elementRect.top - containerRect.top) - offset;
        
        console.log(`Scrolling to position: ${scrollPosition}`);
        
        contentArea.scrollTo({ 
          top: scrollPosition, 
          behavior: 'smooth' 
        });
      } else {
        console.error(`No suitable element found with id "${sectionId}"`);
      }
    }, 50);
  };');
        
        console.log(`Looking for visible element with text: "${targetText}"`);
        
        // Find all headings in the visible content area
        const allHeadings = contentArea.querySelectorAll('h1, h2, h3, h4, h5, h6, p');
        for (const heading of allHeadings) {
          const headingText = heading.textContent.trim();
          if (headingText.includes(targetText) || targetText.includes(headingText.substring(0, 30))) {
            const isVisible = window.getComputedStyle(heading).display !== 'none';
            if (isVisible) {
              scrollTarget = heading;
              console.log(`Found visible match: ${heading.tagName} - "${headingText.substring(0, 50)}"`);
              break;
            }
          }
        }
      }
      
      console.log(`Final scroll target: ${scrollTarget.tagName}`);
      
      // Calculate scroll position relative to the content area
      const containerRect = contentArea.getBoundingClientRect();
      const elementRect = scrollTarget.getBoundingClientRect();
      const currentScroll = contentArea.scrollTop;
      const offset = 80;
      
      const scrollPosition = currentScroll + (elementRect.top - containerRect.top) - offset;
      
      console.log(`Scrolling from ${currentScroll} to position: ${scrollPosition}`);
      
      contentArea.scrollTo({ 
        top: Math.max(0, scrollPosition), 
        behavior: 'smooth' 
      });
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
              
              .doc-content h1, .doc-content h2, .doc-content h3, 
              .doc-content h4, .doc-content h5, .doc-content h6 {
                font-family: 'Times New Roman', Times, serif;
                font-weight: bold;
                margin-top: 24px;
                margin-bottom: 12px;
                color: rgb(29, 38, 44);
              }
              
              .doc-content h1 {
                font-size: 24px;
                border-bottom: 2px solid #DB0011;
                padding-bottom: 8px;
              }
              
              .doc-content h2 {
                font-size: 20px;
              }
              
              .doc-content h3 {
                font-size: 18px;
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
              
              .doc-content a {
                color: #2563eb;
                text-decoration: none;
              }
              
              .doc-content a:hover {
                text-decoration: underline;
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

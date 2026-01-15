// PDF processing utility
// Uses PDF.js library loaded via CDN for browser-based PDF text extraction

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // For browser environment, we'll use a simpler approach
    // Read the file as array buffer
    const arrayBuffer = await file.arrayBuffer()

    // In a real implementation, you would use pdfjs-dist here
    // For now, we'll provide a placeholder that can be enhanced
    // with proper PDF.js integration

    // Try to extract basic text (this is a simplified version)
    const text = await extractTextWithPDFJS(arrayBuffer)

    return text
  } catch (error) {
    console.error('Error extracting text from PDF:', error)
    throw new Error('无法从PDF中提取文本。请确保文件格式正确。')
  }
}

async function extractTextWithPDFJS(arrayBuffer: ArrayBuffer): Promise<string> {
  // This uses PDF.js loaded via CDN
  try {
    // Access PDF.js from window object
    interface PDFJSLib {
      getDocument: (params: { data: ArrayBuffer }) => { promise: Promise<PDFDocumentProxy> }
      GlobalWorkerOptions: { workerSrc: string }
    }

    interface PDFDocumentProxy {
      numPages: number
      getPage: (pageNumber: number) => Promise<PDFPageProxy>
    }

    interface PDFPageProxy {
      getTextContent: () => Promise<TextContent>
    }

    interface TextContent {
      items: Array<{ str: string }>
    }

    const pdfjsLib = (window as typeof window & { pdfjsLib?: PDFJSLib }).pdfjsLib

    if (!pdfjsLib) {
      throw new Error('PDF.js not loaded')
    }

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    let fullText = ''

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map((item) => item.str).join(' ')
      fullText += pageText + '\n\n'
    }

    return fullText.trim()
  } catch (error) {
    // Fallback: Return a message indicating PDF.js is not available
    console.warn('PDF.js not available:', error)
    throw new Error('PDF.js未能成功加载。请刷新页面重试，或检查网络连接。')
  }
}

export function validatePDFFile(file: File): boolean {
  // Check file type
  if (file.type !== 'application/pdf') {
    return false
  }

  // Check file size (limit to 10MB)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    return false
  }

  return true
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

// PDF processing utility
// Note: pdf-parse is a Node.js module and won't work directly in the browser
// For browser-based PDF processing, we'll use pdfjs-dist instead

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
  // This is a placeholder for PDF.js integration
  // In production, you would use pdfjs-dist library
  try {
    // Dynamic import for PDF.js (if available)
    const pdfjsLib = (window as any).pdfjsLib

    if (!pdfjsLib) {
      throw new Error('PDF.js not loaded')
    }

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    let fullText = ''

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map((item: any) => item.str).join(' ')
      fullText += pageText + '\n\n'
    }

    return fullText.trim()
  } catch (error) {
    // Fallback: Return a message indicating manual text extraction needed
    console.warn('PDF.js not available, using fallback')
    return '请注意：由于浏览器限制，PDF文本提取功能受限。建议手动复制PDF内容或使用支持的PDF文件。'
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

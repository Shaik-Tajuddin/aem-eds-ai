import { Chunk, ChunkMetadata, KnowledgeSourceType } from './types';
import { RagError, RagErrorCode } from './errors';

export interface ChunkerOptions {
  maxChunkSize?: number; // target max characters (default: 1000)
  chunkOverlap?: number; // character overlap between consecutive chunks (default: 150)
  minChunkSize?: number; // minimum characters for a standalone chunk (default: 100)
}

export class DocumentChunker {
  private readonly maxChunkSize: number;
  private readonly chunkOverlap: number;
  private readonly minChunkSize: number;

  constructor(options: ChunkerOptions = {}) {
    this.maxChunkSize = options.maxChunkSize ?? 1000;
    this.chunkOverlap = options.chunkOverlap ?? 150;
    this.minChunkSize = options.minChunkSize ?? 100;

    if (this.chunkOverlap >= this.maxChunkSize) {
      throw new RagError(
        RagErrorCode.INVALID_INPUT,
        `chunkOverlap (${this.chunkOverlap}) cannot be greater than or equal to maxChunkSize (${this.maxChunkSize})`
      );
    }
  }

  /**
   * Split a document into semantically coherent chunks, respecting headings and code blocks.
   */
  chunkDocument(params: {
    title: string;
    source: string;
    sourceType: KnowledgeSourceType;
    content: string;
    projectId?: string | null;
  }): Chunk[] {
    const { title, source, sourceType, content, projectId } = params;

    if (!content || !content.trim()) {
      return [];
    }

    const sections = this.splitIntoSemanticSections(content);
    const chunks: Chunk[] = [];
    let currentChunkIndex = 0;

    for (const section of sections) {
      const sectionChunks = this.splitSectionIntoWindowedChunks(section);

      for (const sc of sectionChunks) {
        chunks.push({
          projectId: projectId ?? null,
          title,
          source,
          sourceType,
          content: sc.text,
          chunkIndex: currentChunkIndex++,
          metadata: {
            heading: section.heading,
            subheading: section.subheading,
            language: sc.language,
            isCode: sc.isCode,
            startLine: sc.startLine,
            endLine: sc.endLine,
            tokenCount: Math.ceil(sc.text.length / 4),
          },
        });
      }
    }

    return chunks;
  }

  /**
   * Parses Markdown content into semantic sections based on top-level and second-level headings
   * and preserves fenced code blocks without dissecting them prematurely.
   */
  private splitIntoSemanticSections(content: string): Array<{
    heading?: string;
    subheading?: string;
    lines: string[];
    startLine: number;
  }> {
    const lines = content.split('\n');
    const sections: Array<{
      heading?: string;
      subheading?: string;
      lines: string[];
      startLine: number;
    }> = [];

    let currentHeading: string | undefined;
    let currentSubheading: string | undefined;
    let currentLines: string[] = [];
    let sectionStartLine = 1;
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const trimmed = line.trim();

      if (trimmed.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
      }

      // Heading detection outside code blocks
      if (!inCodeBlock && /^#{1,6}\s+/.test(trimmed)) {
        if (currentLines.length > 0) {
          sections.push({
            heading: currentHeading,
            subheading: currentSubheading,
            lines: [...currentLines],
            startLine: sectionStartLine,
          });
          currentLines = [];
        }

        const match = trimmed.match(/^(#{1,6})\s+(.+)$/);
        if (match) {
          const level = match[1]!.length;
          const title = match[2]!.trim();
          if (level <= 2) {
            currentHeading = title;
            currentSubheading = undefined;
          } else {
            currentSubheading = title;
          }
        }
        sectionStartLine = i + 1;
      }

      currentLines.push(line);
    }

    if (currentLines.length > 0) {
      sections.push({
        heading: currentHeading,
        subheading: currentSubheading,
        lines: currentLines,
        startLine: sectionStartLine,
      });
    }

    return sections;
  }

  /**
   * Sub-splits a semantic section if it exceeds maxChunkSize, respecting code blocks
   * and adding sliding-window overlap.
   */
  private splitSectionIntoWindowedChunks(section: {
    heading?: string;
    subheading?: string;
    lines: string[];
    startLine: number;
  }): Array<{
    text: string;
    language?: string;
    isCode?: boolean;
    startLine: number;
    endLine: number;
  }> {
    const fullText = section.lines.join('\n').trim();
    if (!fullText) return [];

    // If whole section fits comfortably
    if (fullText.length <= this.maxChunkSize) {
      const isCode = fullText.includes('```');
      let language: string | undefined;
      if (isCode) {
        const langMatch = fullText.match(/```(\w+)/);
        language = langMatch ? langMatch[1] : undefined;
      }

      return [{
        text: fullText,
        language,
        isCode,
        startLine: section.startLine,
        endLine: section.startLine + section.lines.length - 1,
      }];
    }

    // Split section line by line into chunks
    const result: Array<{
      text: string;
      language?: string;
      isCode?: boolean;
      startLine: number;
      endLine: number;
    }> = [];

    let currentChunkLines: string[] = [];
    let currentLength = 0;
    let chunkStartLine = section.startLine;
    let inCode = false;
    let codeLanguage: string | undefined;

    for (let idx = 0; idx < section.lines.length; idx++) {
      const line = section.lines[idx]!;
      const lineLen = line.length + 1; // +1 for newline

      if (line.trim().startsWith('```')) {
        inCode = !inCode;
        if (inCode) {
          codeLanguage = line.trim().replace(/^```/, '').trim() || undefined;
        }
      }

      // If adding this line exceeds maxChunkSize and we have accumulated enough content
      if (currentLength + lineLen > this.maxChunkSize && currentChunkLines.length > 0) {
        // If inside code block, close it gracefully in this chunk and reopen in next if needed
        let chunkText = currentChunkLines.join('\n');
        if (inCode && !chunkText.endsWith('```')) {
          chunkText += '\n```';
        }

        result.push({
          text: chunkText.trim(),
          language: codeLanguage,
          isCode: inCode || chunkText.includes('```'),
          startLine: chunkStartLine,
          endLine: chunkStartLine + currentChunkLines.length - 1,
        });

        // Compute overlap lines for sliding window
        const overlapLines: string[] = [];
        let overlapChars = 0;
        for (let j = currentChunkLines.length - 1; j >= 0; j--) {
          const l = currentChunkLines[j]!;
          if (overlapChars + l.length + 1 > this.chunkOverlap) break;
          overlapLines.unshift(l);
          overlapChars += l.length + 1;
        }

        chunkStartLine = chunkStartLine + currentChunkLines.length - overlapLines.length;
        currentChunkLines = [...overlapLines];
        currentLength = overlapChars;

        if (inCode && currentChunkLines.length > 0 && !currentChunkLines[0]?.trim().startsWith('```')) {
          currentChunkLines.unshift(`\`\`\`${codeLanguage ?? ''}`);
        }
      }

      currentChunkLines.push(line);
      currentLength += lineLen;
    }

    if (currentChunkLines.length > 0) {
      const remainingText = currentChunkLines.join('\n').trim();
      if (remainingText.length > 0) {
        result.push({
          text: remainingText,
          language: codeLanguage,
          isCode: inCode || remainingText.includes('```'),
          startLine: chunkStartLine,
          endLine: chunkStartLine + currentChunkLines.length - 1,
        });
      }
    }

    return result;
  }
}

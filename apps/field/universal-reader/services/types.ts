export interface FileRecord {
  id: string;
  name: string;
  extension: string;
  fileType: string;
  content: string;
  size: number;
  savedAt: number;
  pinned?: boolean;
  source: 'picker' | 'paste' | 'url';
  // For ZIP archives
  isZip?: boolean;
  zipEntries?: ZipEntry[];
}

export interface ZipEntry {
  name: string;
  path: string;
  size: number;
  content: string;
  fileType: string;
  extension: string;
  isDirectory: boolean;
}

export interface TokenSpan {
  text: string;
  type: 'keyword' | 'string' | 'comment' | 'number' | 'function' | 'operator' | 'type' | 'plain' | 'decorator' | 'tag' | 'attribute';
}

export interface ExplainSection {
  title: string;
  content: string;
  icon: string;
}

export interface ExplainResult {
  summary: string;
  language: string;
  complexity: 'Simple' | 'Moderate' | 'Complex';
  linesOfCode: number;
  sections: ExplainSection[];
}

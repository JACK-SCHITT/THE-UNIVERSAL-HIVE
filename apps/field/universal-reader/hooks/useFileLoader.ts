import { useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import {
  detectFileType,
  generateId,
  getFileExtension,
} from '../services/fileService';
import { FileRecord, ZipEntry } from '../services/types';
import { useFileContext } from './useFileContext';

// ─── Helpers ────────────────────────────────────────────────────────────────

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, 'utf-8');
  });
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

function isBinaryExtension(ext: string): boolean {
  const binary = new Set([
    'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico', 'tiff', 'svg',
    'mp3', 'mp4', 'wav', 'ogg', 'flac', 'aac', 'mov', 'avi', 'mkv',
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
    'zip', 'gz', 'tar', 'rar', '7z', 'bz2',
    'exe', 'dll', 'so', 'dylib', 'bin', 'dat', 'class', 'o', 'a',
    'ttf', 'otf', 'woff', 'woff2', 'eot',
    'db', 'sqlite', 'sqlite3',
  ]);
  return binary.has(ext.toLowerCase());
}

async function loadJSZip(): Promise<any> {
  // Dynamic import of jszip
  try {
    const mod = await import('jszip');
    return mod.default || mod;
  } catch {
    throw new Error('JSZip not available. Install it with: npx expo install jszip');
  }
}

async function readZipContents(
  data: ArrayBuffer | Uint8Array,
  zipName: string
): Promise<{ entries: ZipEntry[]; summary: string }> {
  const JSZip = await loadJSZip();
  const zip = await JSZip.loadAsync(data);

  const entries: ZipEntry[] = [];
  const filePromises: Promise<void>[] = [];

  zip.forEach((relativePath: string, zipEntry: any) => {
    const isDirectory = zipEntry.dir;
    const ext = getFileExtension(relativePath);

    filePromises.push(
      (async () => {
        let content = '';
        let size = 0;

        if (!isDirectory) {
          if (isBinaryExtension(ext)) {
            content = `[Binary file: ${relativePath}]`;
            try {
              const buf = await zipEntry.async('arraybuffer');
              size = buf.byteLength;
            } catch { size = 0; }
          } else {
            try {
              content = await zipEntry.async('string');
              size = new Blob([content]).size;
            } catch {
              content = `[Could not read: ${relativePath}]`;
            }
          }
        }

        entries.push({
          name: relativePath.split('/').filter(Boolean).pop() || relativePath,
          path: relativePath,
          size,
          content,
          fileType: isDirectory ? 'directory' : detectFileType(relativePath, content),
          extension: ext,
          isDirectory,
        });
      })()
    );
  });

  await Promise.all(filePromises);

  // Sort: directories first, then alphabetically
  entries.sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.path.localeCompare(b.path);
  });

  const fileCount = entries.filter((e) => !e.isDirectory).length;
  const dirCount = entries.filter((e) => e.isDirectory).length;
  const summary = `ZIP archive: ${fileCount} files across ${dirCount} director${dirCount === 1 ? 'y' : 'ies'}`;

  return { entries, summary };
}

// ─── Web file picker ─────────────────────────────────────────────────────────

function webPickFiles(multiple: boolean): Promise<FileList | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = multiple;
    input.accept = '*/*';
    input.style.display = 'none';

    input.onchange = () => {
      resolve(input.files);
      document.body.removeChild(input);
    };
    input.oncancel = () => {
      resolve(null);
      document.body.removeChild(input);
    };

    document.body.appendChild(input);
    input.click();
  });
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useFileLoader() {
  const { setActiveFile, setLoading, setError, setMultiFiles } = useFileContext();

  // ── Web: pick single or multiple files ─────────────────────────────────
  const loadFromPickerWeb = useCallback(async (multiple = false) => {
    try {
      setLoading(true);
      setError(null);

      const files = await webPickFiles(multiple);
      if (!files || files.length === 0) {
        setLoading(false);
        return;
      }

      if (multiple && files.length > 1) {
        // Load multiple files — show a list to browse
        const records: FileRecord[] = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const ext = getFileExtension(file.name);
          let content = '';

          if (file.name.toLowerCase().endsWith('.zip')) {
            const buf = await readFileAsArrayBuffer(file);
            const { entries, summary } = await readZipContents(buf, file.name);
            const record: FileRecord = {
              id: generateId(),
              name: file.name,
              extension: 'zip',
              fileType: 'zip',
              content: summary,
              size: file.size,
              savedAt: Date.now(),
              source: 'picker',
              isZip: true,
              zipEntries: entries,
            };
            records.push(record);
          } else if (isBinaryExtension(ext)) {
            content = `[Binary file — ${file.name} (${(file.size / 1024).toFixed(1)} KB)]\nThis file type cannot be displayed as text.`;
            records.push({
              id: generateId(),
              name: file.name,
              extension: ext,
              fileType: 'binary',
              content,
              size: file.size,
              savedAt: Date.now(),
              source: 'picker',
            });
          } else {
            try {
              content = await readFileAsText(file);
            } catch {
              content = `[Could not read ${file.name}]`;
            }
            const fileType = detectFileType(file.name, content);
            records.push({
              id: generateId(),
              name: file.name,
              extension: ext,
              fileType,
              content,
              size: file.size,
              savedAt: Date.now(),
              source: 'picker',
            });
          }
        }
        setMultiFiles(records);
        return;
      }

      // Single file
      const file = files[0];
      const ext = getFileExtension(file.name);

      if (file.name.toLowerCase().endsWith('.zip')) {
        const buf = await readFileAsArrayBuffer(file);
        const { entries, summary } = await readZipContents(buf, file.name);
        const record: FileRecord = {
          id: generateId(),
          name: file.name,
          extension: 'zip',
          fileType: 'zip',
          content: summary,
          size: file.size,
          savedAt: Date.now(),
          source: 'picker',
          isZip: true,
          zipEntries: entries,
        };
        setActiveFile(record);
        return;
      }

      if (isBinaryExtension(ext)) {
        setActiveFile({
          id: generateId(),
          name: file.name,
          extension: ext,
          fileType: 'binary',
          content: `[Binary file — ${file.name}]\nSize: ${(file.size / 1024).toFixed(1)} KB\nThis file type cannot be displayed as text.`,
          size: file.size,
          savedAt: Date.now(),
          source: 'picker',
        });
        return;
      }

      let content = '';
      try {
        content = await readFileAsText(file);
      } catch (e: any) {
        setError(`Could not read file: ${e?.message || 'Unknown error'}`);
        return;
      }

      const fileType = detectFileType(file.name, content);
      setActiveFile({
        id: generateId(),
        name: file.name,
        extension: ext,
        fileType,
        content,
        size: file.size,
        savedAt: Date.now(),
        source: 'picker',
      });
    } catch (e: any) {
      setError(e?.message || 'Failed to open file.');
    } finally {
      setLoading(false);
    }
  }, [setActiveFile, setLoading, setError, setMultiFiles]);

  // ── Native: pick files (iOS / Android) ────────────────────────────────
  const loadFromPickerNative = useCallback(async (multiple = false) => {
    try {
      setLoading(true);
      setError(null);

      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setLoading(false);
        return;
      }

      const processAsset = async (asset: { name: string; uri: string; size?: number }) => {
        const { name, uri, size } = asset;
        const ext = getFileExtension(name);

        if (name.toLowerCase().endsWith('.zip')) {
          // Read as base64 then convert to Uint8Array
          const b64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const binary = atob(b64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          const { entries, summary } = await readZipContents(bytes, name);
          return {
            id: generateId(),
            name,
            extension: 'zip',
            fileType: 'zip',
            content: summary,
            size: size || bytes.length,
            savedAt: Date.now(),
            source: 'picker' as const,
            isZip: true,
            zipEntries: entries,
          };
        }

        if (isBinaryExtension(ext)) {
          return {
            id: generateId(),
            name,
            extension: ext,
            fileType: 'binary',
            content: `[Binary file — ${name}]\nSize: ${((size || 0) / 1024).toFixed(1)} KB\nThis file type cannot be displayed as text.`,
            size: size || 0,
            savedAt: Date.now(),
            source: 'picker' as const,
          };
        }

        let content = '';
        try {
          content = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.UTF8,
          });
        } catch {
          try {
            const b64 = await FileSystem.readAsStringAsync(uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            content = atob(b64);
          } catch {
            content = '[Could not read file content]';
          }
        }

        const fileType = detectFileType(name, content);
        return {
          id: generateId(),
          name,
          extension: ext,
          fileType,
          content,
          size: size || new Blob([content]).size,
          savedAt: Date.now(),
          source: 'picker' as const,
        };
      };

      if (result.assets.length === 1) {
        const record = await processAsset(result.assets[0]);
        setActiveFile(record);
      } else {
        const records = await Promise.all(result.assets.map(processAsset));
        setMultiFiles(records);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to open file.');
    } finally {
      setLoading(false);
    }
  }, [setActiveFile, setLoading, setError, setMultiFiles]);

  const loadFromPicker = useCallback(async (multiple = false) => {
    if (Platform.OS === 'web') {
      return loadFromPickerWeb(multiple);
    }
    return loadFromPickerNative(multiple);
  }, [loadFromPickerWeb, loadFromPickerNative]);

  // ── URL ────────────────────────────────────────────────────────────────
  const loadFromURL = useCallback(async (url: string) => {
    if (!url.trim()) {
      setError('Please enter a URL.');
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(url.trim(), {
        headers: { Accept: 'text/plain, application/json, */*' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const urlParts = url.split('/');
      const rawName = urlParts[urlParts.length - 1]?.split('?')[0] || 'remote-file.txt';
      const name = decodeURIComponent(rawName) || 'remote-file.txt';
      const ext = getFileExtension(name);

      if (name.toLowerCase().endsWith('.zip')) {
        const buf = await response.arrayBuffer();
        const { entries, summary } = await readZipContents(buf, name);
        setActiveFile({
          id: generateId(),
          name,
          extension: 'zip',
          fileType: 'zip',
          content: summary,
          size: buf.byteLength,
          savedAt: Date.now(),
          source: 'url',
          isZip: true,
          zipEntries: entries,
        });
        return;
      }

      const content = await response.text();
      const fileType = detectFileType(name, content);
      setActiveFile({
        id: generateId(),
        name,
        extension: ext,
        fileType,
        content,
        size: new Blob([content]).size,
        savedAt: Date.now(),
        source: 'url',
      });
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch URL.');
    } finally {
      setLoading(false);
    }
  }, [setActiveFile, setLoading, setError]);

  // ── Paste ──────────────────────────────────────────────────────────────
  const loadFromPaste = useCallback((name: string, content: string) => {
    if (!content.trim()) {
      setError('Paste some content first.');
      return;
    }
    const fileName = name.trim() || 'pasted-file.txt';
    const fileType = detectFileType(fileName, content);
    setActiveFile({
      id: generateId(),
      name: fileName,
      extension: getFileExtension(fileName),
      fileType,
      content,
      size: new Blob([content]).size,
      savedAt: Date.now(),
      source: 'paste',
    });
    setError(null);
  }, [setActiveFile, setError]);

  return { loadFromPicker, loadFromURL, loadFromPaste };
}

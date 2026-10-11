import { TokenSpan } from './types';

const JS_TS_KEYWORDS = new Set([
  'abstract','as','async','await','break','case','catch','class','const','continue',
  'debugger','declare','default','delete','do','else','enum','export','extends',
  'false','finally','for','from','function','get','if','implements','import','in',
  'instanceof','interface','keyof','let','module','namespace','new','null','of',
  'override','package','private','protected','public','readonly','return','set',
  'static','super','switch','this','throw','true','try','type','typeof','undefined',
  'var','void','while','with','yield','satisfies','using',
]);

const PYTHON_KEYWORDS = new Set([
  'and','as','assert','async','await','break','class','continue','def','del',
  'elif','else','except','False','finally','for','from','global','if','import',
  'in','is','lambda','None','nonlocal','not','or','pass','raise','return',
  'True','try','while','with','yield',
]);

const GO_KEYWORDS = new Set([
  'break','case','chan','const','continue','default','defer','else','fallthrough',
  'for','func','go','goto','if','import','interface','map','package','range',
  'return','select','struct','switch','type','var','nil','true','false','iota',
]);

const RUST_KEYWORDS = new Set([
  'as','async','await','break','const','continue','crate','dyn','else','enum',
  'extern','false','fn','for','if','impl','in','let','loop','match','mod','move',
  'mut','pub','ref','return','self','Self','static','struct','super','trait',
  'true','type','union','unsafe','use','where','while','Box','Option','Result',
  'Some','None','Ok','Err','Vec','String','str','i32','u32','i64','u64','usize',
  'bool','f32','f64','char',
]);

const JAVA_KEYWORDS = new Set([
  'abstract','assert','boolean','break','byte','case','catch','char','class',
  'const','continue','default','do','double','else','enum','extends','final',
  'finally','float','for','goto','if','implements','import','instanceof','int',
  'interface','long','native','new','null','package','private','protected',
  'public','return','short','static','strictfp','super','switch','synchronized',
  'this','throw','throws','transient','true','false','try','var','void','volatile','while',
]);

const PYTHON_BUILTINS = new Set([
  'print','len','range','type','str','int','float','list','dict','set','tuple',
  'bool','input','open','super','property','staticmethod','classmethod','object',
  'Exception','ValueError','TypeError','KeyError','IndexError','AttributeError',
  'isinstance','issubclass','hasattr','getattr','setattr','enumerate','zip','map',
  'filter','sorted','reversed','any','all','min','max','sum','abs','round',
]);

function getKeywords(fileType: string): Set<string> {
  switch (fileType) {
    case 'javascript': case 'typescript': return JS_TS_KEYWORDS;
    case 'python': return PYTHON_KEYWORDS;
    case 'go': return GO_KEYWORDS;
    case 'rust': return RUST_KEYWORDS;
    case 'java': case 'kotlin': case 'csharp': return JAVA_KEYWORDS;
    default: return new Set();
  }
}

function tokenizeGeneric(line: string, fileType: string): TokenSpan[] {
  const tokens: TokenSpan[] = [];
  const keywords = getKeywords(fileType);
  const isPython = fileType === 'python';

  // Full-line comment patterns
  const fullLineCommentPatterns: Record<string, RegExp> = {
    javascript: /^(\s*\/\/.*)/,
    typescript: /^(\s*\/\/.*)/,
    go: /^(\s*\/\/.*)/,
    rust: /^(\s*\/\/.*)/,
    python: /^(\s*#.*)/,
    bash: /^(\s*#.*)/,
    ruby: /^(\s*#.*)/,
    config: /^(\s*#.*)/,
    r: /^(\s*#.*)/,
  };

  const lineCommentPat = fullLineCommentPatterns[fileType];
  if (lineCommentPat && lineCommentPat.test(line)) {
    return [{ text: line, type: 'comment' }];
  }

  // Tokenize character by character
  let i = 0;
  let current = '';
  const flush = (type: TokenSpan['type']) => {
    if (current) { tokens.push({ text: current, type }); current = ''; }
  };

  while (i < line.length) {
    // Line comments
    if ((fileType === 'javascript' || fileType === 'typescript' || fileType === 'go' || fileType === 'rust' || fileType === 'java' || fileType === 'kotlin' || fileType === 'csharp' || fileType === 'cpp' || fileType === 'c' || fileType === 'swift' || fileType === 'php' || fileType === 'dart') && line[i] === '/' && line[i + 1] === '/') {
      flush('plain');
      tokens.push({ text: line.slice(i), type: 'comment' });
      break;
    }
    if ((fileType === 'python' || fileType === 'bash' || fileType === 'ruby') && line[i] === '#') {
      flush('plain');
      tokens.push({ text: line.slice(i), type: 'comment' });
      break;
    }
    // SQL comments
    if (fileType === 'sql' && line[i] === '-' && line[i + 1] === '-') {
      flush('plain');
      tokens.push({ text: line.slice(i), type: 'comment' });
      break;
    }

    // Decorators
    if (line[i] === '@' && (fileType === 'python' || fileType === 'typescript' || fileType === 'javascript' || fileType === 'java')) {
      flush('plain');
      let dec = '@';
      i++;
      while (i < line.length && /\w/.test(line[i])) { dec += line[i]; i++; }
      tokens.push({ text: dec, type: 'decorator' });
      continue;
    }

    // Strings (single and double quotes)
    if (line[i] === '"' || line[i] === "'") {
      const quote = line[i];
      flush('plain');
      let str = quote;
      i++;
      while (i < line.length) {
        if (line[i] === '\\') { str += line[i] + (line[i + 1] || ''); i += 2; continue; }
        str += line[i];
        if (line[i] === quote) { i++; break; }
        i++;
      }
      tokens.push({ text: str, type: 'string' });
      continue;
    }

    // Template literals
    if (line[i] === '`') {
      flush('plain');
      let str = '`';
      i++;
      while (i < line.length) {
        if (line[i] === '\\') { str += line[i] + (line[i + 1] || ''); i += 2; continue; }
        str += line[i];
        if (line[i] === '`') { i++; break; }
        i++;
      }
      tokens.push({ text: str, type: 'string' });
      continue;
    }

    // Numbers
    if (/[0-9]/.test(line[i]) && (current === '' || /\s/.test(current[current.length - 1]))) {
      flush('plain');
      let num = '';
      while (i < line.length && /[0-9._xXaAbBcCdDeEfFoOuUlLn]/.test(line[i])) { num += line[i]; i++; }
      tokens.push({ text: num, type: 'number' });
      continue;
    }

    // Identifiers and keywords
    if (/[a-zA-Z_$]/.test(line[i])) {
      flush('plain');
      let word = '';
      while (i < line.length && /[\w$]/.test(line[i])) { word += line[i]; i++; }

      // Peek ahead for function call
      const nextNonSpace = line.slice(i).match(/^\s*\(/);

      if (keywords.has(word)) {
        tokens.push({ text: word, type: 'keyword' });
      } else if (isPython && PYTHON_BUILTINS.has(word) && nextNonSpace) {
        tokens.push({ text: word, type: 'function' });
      } else if (nextNonSpace && /^[a-z_]/.test(word)) {
        tokens.push({ text: word, type: 'function' });
      } else if (/^[A-Z]/.test(word)) {
        tokens.push({ text: word, type: 'type' });
      } else {
        tokens.push({ text: word, type: 'plain' });
      }
      continue;
    }

    // Operators
    if (/[=+\-*/<>!&|^%?:~]/.test(line[i])) {
      flush('plain');
      let op = line[i]; i++;
      if (/[=+\-*/<>!&|^]/.test(line[i] || '')) { op += line[i]; i++; }
      tokens.push({ text: op, type: 'operator' });
      continue;
    }

    current += line[i];
    i++;
  }

  flush('plain');
  return tokens;
}

function tokenizeXMLHTML(line: string): TokenSpan[] {
  const tokens: TokenSpan[] = [];
  let i = 0;

  while (i < line.length) {
    if (line[i] === '<') {
      let tag = '<';
      i++;
      // Comment
      if (line.slice(i, i + 3) === '!--') {
        let comment = '<';
        while (i < line.length) {
          comment += line[i];
          if (line.slice(i - 1, i + 2) === '-->') { i++; break; }
          i++;
        }
        tokens.push({ text: comment, type: 'comment' });
        continue;
      }
      // Closing tag marker
      let isClose = false;
      if (line[i] === '/') { tag += '/'; i++; isClose = true; }
      // Tag name
      let tagName = '';
      while (i < line.length && /[\w:\-.]/.test(line[i])) { tagName += line[i]; i++; }
      tokens.push({ text: tag + tagName, type: 'tag' });
      // Attributes
      while (i < line.length && line[i] !== '>') {
        if (line[i] === '"' || line[i] === "'") {
          const q = line[i]; let str = q; i++;
          while (i < line.length && line[i] !== q) { str += line[i]; i++; }
          str += q; i++;
          tokens.push({ text: str, type: 'string' });
        } else if (/[a-zA-Z_\-:]/.test(line[i])) {
          let attr = '';
          while (i < line.length && /[\w\-:]/.test(line[i])) { attr += line[i]; i++; }
          tokens.push({ text: attr, type: 'attribute' });
        } else {
          tokens.push({ text: line[i], type: 'plain' });
          i++;
        }
      }
      if (i < line.length) { tokens.push({ text: line[i], type: 'tag' }); i++; }
    } else {
      let plain = '';
      while (i < line.length && line[i] !== '<') { plain += line[i]; i++; }
      if (plain) tokens.push({ text: plain, type: 'plain' });
    }
  }
  return tokens;
}

function tokenizeJSON(line: string): TokenSpan[] {
  const tokens: TokenSpan[] = [];
  let i = 0;
  const trim = line.trimStart();

  while (i < line.length) {
    if (line[i] === '"') {
      let str = '"'; i++;
      const isKey = tokens.filter(t => t.type !== 'plain').length === 0;
      while (i < line.length && line[i] !== '"') {
        if (line[i] === '\\') { str += line[i] + (line[i+1] || ''); i += 2; continue; }
        str += line[i]; i++;
      }
      str += '"'; i++;
      // Peek for colon (object key)
      const rest = line.slice(i).trimStart();
      tokens.push({ text: str, type: rest.startsWith(':') ? 'attribute' : 'string' });
    } else if (/[0-9\-]/.test(line[i]) && (i === 0 || /[\s,\[:]/.test(line[i-1]))) {
      let num = '';
      while (i < line.length && /[0-9.\-eE+]/.test(line[i])) { num += line[i]; i++; }
      tokens.push({ text: num, type: 'number' });
    } else if (line.slice(i).match(/^(true|false|null)/)) {
      const kw = line.slice(i).match(/^(true|false|null)/)![1];
      tokens.push({ text: kw, type: 'keyword' });
      i += kw.length;
    } else {
      tokens.push({ text: line[i], type: 'plain' });
      i++;
    }
  }
  return tokens;
}

export function tokenizeLine(line: string, fileType: string): TokenSpan[] {
  try {
    if (fileType === 'html' || fileType === 'xml' || fileType === 'vue' || fileType === 'svelte') {
      return tokenizeXMLHTML(line);
    }
    if (fileType === 'json') {
      return tokenizeJSON(line);
    }
    if (fileType === 'text' || fileType === 'markdown') {
      return [{ text: line, type: 'plain' }];
    }
    return tokenizeGeneric(line, fileType);
  } catch {
    return [{ text: line, type: 'plain' }];
  }
}

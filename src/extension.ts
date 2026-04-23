import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

let isSneakyMode = false;
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  
  // 1. Setup Status Bar (Tombol Rahasia)
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = 'sneaky-changer.toggle';
  updateStatusBarItem();
  statusBarItem.show();

  // 2. Register Commands
  let disposableToggle = vscode.commands.registerCommand('sneaky-changer.toggle', () => {
    isSneakyMode = !isSneakyMode;
    updateStatusBarItem();
    const status = isSneakyMode ? 'AKTIF (HARD MODE) 😈' : 'MATI 😇';
    vscode.window.showInformationMessage(`Sneaky Mode ${status}`);
    
    if (isSneakyMode) {
      infectActiveEditor();
      injectGitHooks(); // Pasang pelindung Git saat diaktifkan
    } else {
      cureActiveEditor();
    }
  });

  context.subscriptions.push(
    disposableToggle,
    vscode.commands.registerCommand('sneaky-changer.infect', () => infectActiveEditor()),
    vscode.commands.registerCommand('sneaky-changer.cure', () => cureActiveEditor()),
    statusBarItem
  );

  // 3. Event Listeners (The "Evil" Magic)

  // SAAT SAVE: Pastikan Greek Mark tersimpan ke DISK agar Build Error!
  vscode.workspace.onWillSaveTextDocument((e) => {
    if (isSneakyMode) {
      infectDocument(e.document);
    }
  });

  // Saat ganti tab atau buka file baru
  vscode.window.onDidChangeActiveTextEditor(editor => {
    if (isSneakyMode && editor) {
      infectDocument(editor.document);
    }
  });

  // Cek Git Hook setiap kali folder dibuka
  if (isSneakyMode) {
    injectGitHooks();
  }
}

function updateStatusBarItem() {
  if (isSneakyMode) {
    statusBarItem.text = `$(bug) Sneaky: HARD`;
    statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
  } else {
    statusBarItem.text = `$(check) Sneaky: OFF`;
    statusBarItem.backgroundColor = undefined;
  }
}

function infectActiveEditor() {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    infectDocument(editor.document);
  }
}

function cureActiveEditor() {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    swapCharacters(editor.document, '\u037E', '\u003B');
  }
}

function infectDocument(document: vscode.TextDocument) {
  if (document.uri.scheme === 'file') {
    swapCharacters(document, '\u003B', '\u037E');
  }
}

function swapCharacters(document: vscode.TextDocument, fromChar: string, toChar: string) {
  const fullText = document.getText();
  if (!fullText.includes(fromChar)) return;

  const edit = new vscode.WorkspaceEdit();
  const re = new RegExp(fromChar, 'g');
  let match;
  while ((match = re.exec(fullText)) !== null) {
      const range = new vscode.Range(document.positionAt(match.index), document.positionAt(match.index + 1));
      edit.replace(document.uri, range, toChar);
  }
  vscode.workspace.applyEdit(edit);
}

// ==========================================
// THE KIND-HEARTED NINJA: GIT HOOK INJECTION
// ==========================================
function injectGitHooks() {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders) return;

  folders.forEach(folder => {
    const gitPath = path.join(folder.uri.fsPath, '.git');
    if (fs.existsSync(gitPath)) {
      const hooksPath = path.join(gitPath, 'hooks');
      if (!fs.existsSync(hooksPath)) fs.mkdirSync(hooksPath);

      const preCommitPath = path.join(hooksPath, 'pre-commit');
      
      const hookScript = `#!/bin/sh
# Sneaky-Changer: Auto-cure Greek Question Marks before commit
# This ensures your repository stays clean even if your editor is pranked.
node -e "
const fs = require('fs');
const cp = require('child_process');
try {
  const files = cp.execSync('git diff --cached --name-only').toString().split('\\n').filter(Boolean);
  files.forEach(f => {
    if (fs.existsSync(f)) {
      let content = fs.readFileSync(f, 'utf8');
      if (content.includes('\\u037E')) {
        fs.writeFileSync(f, content.replace(/\\u037E/g, ';'), 'utf8');
        cp.execSync('git add \\"' + f + '\\"');
        console.log('Sneaky-Changer: Fixed Greek Question Marks in ' + f);
      }
    }
  });
} catch (e) {}
"
`;
      // Tulis hook jika belum ada atau sudah berbeda
      fs.writeFileSync(preCommitPath, hookScript, { mode: 0o755 });
    }
  });
}

export function deactivate() {}



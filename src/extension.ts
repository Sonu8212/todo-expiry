import * as vscode from 'vscode';

// Decoration types — created once, reused across all updates
let greenDecoration: vscode.TextEditorDecorationType;
let yellowDecoration: vscode.TextEditorDecorationType;
let redDecoration: vscode.TextEditorDecorationType;

let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  greenDecoration = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(0, 200, 100, 0.15)',
    border: '1px solid rgba(0, 200, 100, 0.5)',
    borderRadius: '3px',
  });

  yellowDecoration = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(255, 200, 0, 0.2)',
    border: '1px solid rgba(255, 200, 0, 0.6)',
    borderRadius: '3px',
  });

  redDecoration = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(255, 60, 60, 0.2)',
    border: '1px solid rgba(255, 60, 60, 0.7)',
    borderRadius: '3px',
  });

  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  context.subscriptions.push(statusBarItem);

  // Run on the active editor immediately + whenever it changes
  if (vscode.window.activeTextEditor) {
    updateDecorations(vscode.window.activeTextEditor);
  }

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor) { updateDecorations(editor); }
    }),
    vscode.workspace.onDidChangeTextDocument(event => {
      const editor = vscode.window.activeTextEditor;
      if (editor && event.document === editor.document) {
        updateDecorations(editor);
      }
    }),
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('todoExpiry')) {
        if (vscode.window.activeTextEditor) {
          updateDecorations(vscode.window.activeTextEditor);
        }
      }
    })
  );
}

function getDaysLeft(dateStr: string): number {
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - today.getTime()) / 86400000);
}

function buildHoverMessage(daysLeft: number, dateStr: string): vscode.MarkdownString {
  const md = new vscode.MarkdownString();
  if (daysLeft > 0) {
    md.appendMarkdown(`**TODO Expiry** — Due \`${dateStr}\`\n\n⏳ **${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining**`);
  } else if (daysLeft === 0) {
    md.appendMarkdown(`**TODO Expiry** — Due \`${dateStr}\`\n\n🔴 **Due today!**`);
  } else {
    md.appendMarkdown(`**TODO Expiry** — Due \`${dateStr}\`\n\n🚨 **Overdue by ${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? '' : 's'}**`);
  }
  return md;
}

function updateDecorations(editor: vscode.TextEditor) {
  const config = vscode.workspace.getConfiguration('todoExpiry');
  const warningDays = config.get<number>('warningDays', 7);
  const patternStr = config.get<string>('pattern', 'TODO\\[(\\d{4}-\\d{2}-\\d{2})\\]');

  const regex = new RegExp(patternStr, 'g');
  const text = editor.document.getText();

  const greens: vscode.DecorationOptions[] = [];
  const yellows: vscode.DecorationOptions[] = [];
  const reds: vscode.DecorationOptions[] = [];

  let overdueCount = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const dateStr = match[1];
    const daysLeft = getDaysLeft(dateStr);
    const startPos = editor.document.positionAt(match.index);
    const endPos = editor.document.positionAt(match.index + match[0].length);
    const range = new vscode.Range(startPos, endPos);
    const hoverMessage = buildHoverMessage(daysLeft, dateStr);
    const decoration: vscode.DecorationOptions = { range, hoverMessage };

    if (daysLeft > warningDays) {
      greens.push(decoration);
    } else if (daysLeft > 0) {
      yellows.push(decoration);
    } else {
      reds.push(decoration);
      overdueCount++;
    }
  }

  editor.setDecorations(greenDecoration, greens);
  editor.setDecorations(yellowDecoration, yellows);
  editor.setDecorations(redDecoration, reds);

  const total = greens.length + yellows.length + reds.length;
  if (total === 0) {
    statusBarItem.hide();
  } else {
    const parts: string[] = [];
    if (overdueCount > 0) { parts.push(`$(error) ${overdueCount} overdue`); }
    if (yellows.length > 0) { parts.push(`$(warning) ${yellows.length} due soon`); }
    if (greens.length > 0) { parts.push(`$(check) ${greens.length} on track`); }
    statusBarItem.text = `TODO: ${parts.join('  ')}`;
    statusBarItem.tooltip = `TODO Expiry: ${total} dated TODO${total === 1 ? '' : 's'} in this file`;
    statusBarItem.show();
  }
}

export function deactivate() {
  greenDecoration?.dispose();
  yellowDecoration?.dispose();
  redDecoration?.dispose();
}

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
let greenDecoration;
let yellowDecoration;
let redDecoration;
let statusBarItem;
function activate(context) {
    vscode.window.showInformationMessage('✅ TODO Expiry activated!');
    greenDecoration = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(0, 200, 100, 0.4)',
        border: '2px solid lime',
        color: '#ccffcc',
        overviewRulerColor: 'lime',
        overviewRulerLane: vscode.OverviewRulerLane.Right,
    });
    yellowDecoration = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255, 200, 0, 0.4)',
        border: '2px solid yellow',
        color: '#ffffaa',
        overviewRulerColor: 'yellow',
        overviewRulerLane: vscode.OverviewRulerLane.Right,
    });
    redDecoration = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255, 0, 0, 0.5)',
        border: '2px solid red',
        color: '#ffaaaa',
        overviewRulerColor: 'red',
        overviewRulerLane: vscode.OverviewRulerLane.Right,
    });
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.command = 'todoExpiry.refresh';
    context.subscriptions.push(statusBarItem);
    // Register manual refresh command
    const refreshCmd = vscode.commands.registerCommand('todoExpiry.refresh', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            vscode.window.showInformationMessage(`Refreshing decorations on: ${editor.document.fileName}`);
            updateDecorations(editor);
        }
        else {
            vscode.window.showWarningMessage('No active editor found.');
        }
    });
    context.subscriptions.push(refreshCmd);
    // Apply to all visible editors now
    vscode.window.visibleTextEditors.forEach(e => updateDecorations(e));
    setTimeout(() => {
        vscode.window.visibleTextEditors.forEach(e => updateDecorations(e));
    }, 1000);
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
            updateDecorations(editor);
        }
    }), vscode.window.onDidChangeVisibleTextEditors(editors => {
        editors.forEach(e => updateDecorations(e));
    }), vscode.workspace.onDidChangeTextDocument(event => {
        const editor = vscode.window.activeTextEditor;
        if (editor && event.document === editor.document) {
            updateDecorations(editor);
        }
    }));
}
function getDaysLeft(dateStr) {
    const due = new Date(dateStr);
    due.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((due.getTime() - today.getTime()) / 86400000);
}
function updateDecorations(editor) {
    const TODO_REGEX = /TODO\[(\d{4}-\d{2}-\d{2})\]/g;
    const text = editor.document.getText();
    const greens = [];
    const yellows = [];
    const reds = [];
    let match;
    while ((match = TODO_REGEX.exec(text)) !== null) {
        const dateStr = match[1];
        const daysLeft = getDaysLeft(dateStr);
        const startPos = editor.document.positionAt(match.index);
        const endPos = editor.document.positionAt(match.index + match[0].length);
        const range = new vscode.Range(startPos, endPos);
        let hoverMsg;
        if (daysLeft < 0) {
            hoverMsg = `🚨 Overdue by ${Math.abs(daysLeft)} days`;
        }
        else if (daysLeft === 0) {
            hoverMsg = `🔴 Due today!`;
        }
        else {
            hoverMsg = `⏳ ${daysLeft} days remaining`;
        }
        const decoration = {
            range,
            hoverMessage: new vscode.MarkdownString(`**TODO Expiry** — \`${dateStr}\`\n\n${hoverMsg}`),
        };
        if (daysLeft > 7) {
            greens.push(decoration);
        }
        else if (daysLeft > 0) {
            yellows.push(decoration);
        }
        else {
            reds.push(decoration);
        }
    }
    editor.setDecorations(greenDecoration, greens);
    editor.setDecorations(yellowDecoration, yellows);
    editor.setDecorations(redDecoration, reds);
    const total = greens.length + yellows.length + reds.length;
    const overdueCount = reds.length;
    if (total === 0) {
        statusBarItem.hide();
    }
    else {
        const parts = [];
        if (overdueCount > 0) {
            parts.push(`$(error) ${overdueCount} overdue`);
        }
        if (yellows.length > 0) {
            parts.push(`$(warning) ${yellows.length} due soon`);
        }
        if (greens.length > 0) {
            parts.push(`$(check) ${greens.length} on track`);
        }
        statusBarItem.text = `TODO: ${parts.join('  ')}`;
        statusBarItem.tooltip = `Click to refresh TODO Expiry`;
        statusBarItem.show();
    }
}
function deactivate() {
    greenDecoration?.dispose();
    yellowDecoration?.dispose();
    redDecoration?.dispose();
}
//# sourceMappingURL=extension.js.map
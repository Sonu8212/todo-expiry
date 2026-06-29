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
// Decoration types — created once, reused across all updates
let greenDecoration;
let yellowDecoration;
let redDecoration;
let statusBarItem;
function activate(context) {
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
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
            updateDecorations(editor);
        }
    }), vscode.workspace.onDidChangeTextDocument(event => {
        const editor = vscode.window.activeTextEditor;
        if (editor && event.document === editor.document) {
            updateDecorations(editor);
        }
    }), vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('todoExpiry')) {
            if (vscode.window.activeTextEditor) {
                updateDecorations(vscode.window.activeTextEditor);
            }
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
function buildHoverMessage(daysLeft, dateStr) {
    const md = new vscode.MarkdownString();
    if (daysLeft > 0) {
        md.appendMarkdown(`**TODO Expiry** — Due \`${dateStr}\`\n\n⏳ **${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining**`);
    }
    else if (daysLeft === 0) {
        md.appendMarkdown(`**TODO Expiry** — Due \`${dateStr}\`\n\n🔴 **Due today!**`);
    }
    else {
        md.appendMarkdown(`**TODO Expiry** — Due \`${dateStr}\`\n\n🚨 **Overdue by ${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? '' : 's'}**`);
    }
    return md;
}
function updateDecorations(editor) {
    const config = vscode.workspace.getConfiguration('todoExpiry');
    const warningDays = config.get('warningDays', 7);
    const patternStr = config.get('pattern', 'TODO\\[(\\d{4}-\\d{2}-\\d{2})\\]');
    const regex = new RegExp(patternStr, 'g');
    const text = editor.document.getText();
    const greens = [];
    const yellows = [];
    const reds = [];
    let overdueCount = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
        const dateStr = match[1];
        const daysLeft = getDaysLeft(dateStr);
        const startPos = editor.document.positionAt(match.index);
        const endPos = editor.document.positionAt(match.index + match[0].length);
        const range = new vscode.Range(startPos, endPos);
        const hoverMessage = buildHoverMessage(daysLeft, dateStr);
        const decoration = { range, hoverMessage };
        if (daysLeft > warningDays) {
            greens.push(decoration);
        }
        else if (daysLeft > 0) {
            yellows.push(decoration);
        }
        else {
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
        statusBarItem.tooltip = `TODO Expiry: ${total} dated TODO${total === 1 ? '' : 's'} in this file`;
        statusBarItem.show();
    }
}
function deactivate() {
    greenDecoration?.dispose();
    yellowDecoration?.dispose();
    redDecoration?.dispose();
}
//# sourceMappingURL=extension.js.map
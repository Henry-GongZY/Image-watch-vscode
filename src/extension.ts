import * as vscode from 'vscode';
import { ImageWatchPanel } from './imageWatchPanel';

export function activate(context: vscode.ExtensionContext) {
    const openPanelCommand = vscode.commands.registerCommand('image-watch-vscode.openPanel', () => {
        ImageWatchPanel.createOrShow(context.extensionUri);
    });

    const clearImagesCommand = vscode.commands.registerCommand('image-watch-vscode.clearImages', () => {
        ImageWatchPanel.currentPanel?.clearImages();
    });

    const addToWatchCommand = vscode.commands.registerCommand('image-watch-vscode.addToWatch', async () => {
        ImageWatchPanel.createOrShow(context.extensionUri);
        await ImageWatchPanel.currentPanel?.addFromDebug();
    });

    const refreshCommand = vscode.commands.registerCommand('image-watch-vscode.refresh', async () => {
        await ImageWatchPanel.currentPanel?.refreshWatchList();
    });

    context.subscriptions.push(openPanelCommand, clearImagesCommand, addToWatchCommand, refreshCommand);

    context.subscriptions.push(
        vscode.debug.registerDebugAdapterTrackerFactory('*', new ImageWatchDebugAdapterTrackerFactory())
    );

    context.subscriptions.push(
        vscode.debug.onDidChangeActiveStackItem(async () => {
            if (ImageWatchPanel.currentPanel?.hasWatchItems() && vscode.debug.activeDebugSession) {
                await ImageWatchPanel.currentPanel.refreshWatchList();
            }
        })
    );
}

export function deactivate() { }

class ImageWatchDebugAdapterTrackerFactory implements vscode.DebugAdapterTrackerFactory {
    createDebugAdapterTracker(_session: vscode.DebugSession): vscode.DebugAdapterTracker {
        return {
            onWillStopSession() {
                ImageWatchPanel.currentPanel?.onDebugStop();
            }
        };
    }
}

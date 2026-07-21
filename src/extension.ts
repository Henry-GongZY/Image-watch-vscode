import * as vscode from 'vscode';
import { ImageWatchPanel } from './imageWatchPanel';

export function activate(context: vscode.ExtensionContext) {
    const autoOpenedSessions = new Set<string>();

    const openPanelCommand = vscode.commands.registerCommand('image-watch-vscode.openPanel', () => {
        ImageWatchPanel.createOrShow();
    });

    const clearImagesCommand = vscode.commands.registerCommand('image-watch-vscode.clearImages', () => {
        ImageWatchPanel.currentPanel?.clearImages();
    });

    const addToWatchCommand = vscode.commands.registerCommand('image-watch-vscode.addToWatch', async () => {
        ImageWatchPanel.createOrShow();
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
        vscode.debug.onDidChangeActiveStackItem(async (stackItem) => {
            const session = vscode.debug.activeDebugSession;
            if (!session) { return; }

            const isActiveFrame = stackItem !== undefined &&
                stackItem.session.id === session.id &&
                'frameId' in stackItem;
            const autoOpen = vscode.workspace
                .getConfiguration('imageWatch')
                .get<boolean>('autoOpenOnFirstBreak', false);

            if (isActiveFrame && autoOpen && !autoOpenedSessions.has(session.id)) {
                autoOpenedSessions.add(session.id);
                ImageWatchPanel.createOrShow();
                await ImageWatchPanel.currentPanel?.addFromDebug();
            }

            if (ImageWatchPanel.currentPanel?.hasWatchItems()) {
                await ImageWatchPanel.currentPanel.refreshWatchList();
            }
        })
    );

    context.subscriptions.push(
        vscode.debug.onDidTerminateDebugSession((session) => {
            autoOpenedSessions.delete(session.id);
        })
    );
}

class ImageWatchDebugAdapterTrackerFactory implements vscode.DebugAdapterTrackerFactory {
    createDebugAdapterTracker(_session: vscode.DebugSession): vscode.DebugAdapterTracker {
        return {
            onWillStopSession() {
                ImageWatchPanel.currentPanel?.onDebugStop();
            }
        };
    }
}

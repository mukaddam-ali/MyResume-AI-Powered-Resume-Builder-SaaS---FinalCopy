"use client";

import { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class PDFErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, error: undefined };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-muted/20 border-2 border-dashed border-destructive/20 rounded-lg">
                    <div className="bg-destructive/10 p-4 rounded-full mb-4">
                        <AlertCircle className="h-8 w-8 text-destructive" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Preview Error</h3>
                    <p className="text-sm text-muted-foreground mb-4 max-w-md">
                        Unable to render the PDF preview. This usually happens if the content is too complex or there's a font loading issue.
                    </p>
                    {this.state.error && (
                        <pre className="text-xs bg-muted p-4 rounded mb-4 overflow-auto max-w-full text-left font-mono">
                            {this.state.error.message}
                        </pre>
                    )}
                    <Button
                        variant="outline"
                        onClick={() => this.setState({ hasError: false })}
                        className="gap-2"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry Preview
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}

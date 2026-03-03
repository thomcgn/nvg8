"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

type Props = {
    files: File[];
    onUploadClick: () => void;
    onRemoveAt: (idx: number) => void;
    disabled?: boolean;
};

export function UploadInfoList({
                                   files,
                                   onUploadClick,
                                   onRemoveAt,
                                   disabled = false,
                               }: Props) {
    return (
        <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onUploadClick}
                    disabled={disabled}
                >
                    Unterlagen hochladen
                </Button>

                <div className="text-xs text-muted-foreground">
                    {files.length === 0
                        ? "Keine Datei ausgewählt"
                        : `${files.length} Datei(en)`}
                </div>
            </div>

            {files.length > 0 && (
                <div className="space-y-1">
                    {files.map((file, idx) => (
                        <div
                            key={`${file.name}-${file.size}-${file.lastModified}-${idx}`}
                            className="flex items-center justify-between gap-2 rounded-md border border-border px-2 py-1"
                        >
                            <div className="min-w-0 text-xs text-muted-foreground truncate">
                                {file.name}
                            </div>

                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => onRemoveAt(idx)}
                                disabled={disabled}
                                className="h-6 w-6 text-destructive hover:text-destructive"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
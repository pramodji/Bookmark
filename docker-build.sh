#!/bin/bash
set -e

APP_NAME="bookmark"
OUTPUT_FILE="bookmark-image.tar"

echo "🔨 Building Docker image..."
docker build -t "$APP_NAME" .

echo "💾 Saving image to $OUTPUT_FILE..."
docker save -o "$OUTPUT_FILE" "$APP_NAME"

echo "✅ Done! Image saved to $OUTPUT_FILE ($(du -h "$OUTPUT_FILE" | cut -f1))"
echo "📦 To load later: docker load -i $OUTPUT_FILE"

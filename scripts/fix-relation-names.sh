#!/bin/bash

# Fix relation names in API files after prisma db pull

# Find all TypeScript files in src/app/api
find src/app/api -name "*.ts" -type f | while read file; do
  # Backup original
  cp "$file" "$file.bak"

  # Fix Order relation names
  sed -i '' 's/include: {$/&/' "$file"
  sed -i '' 's/\([[:space:]]*\)clinic: {/\1Clinic: {/g' "$file"
  sed -i '' 's/\([[:space:]]*\)doctor: {/\1User_Order_doctorIdToUser: {/g' "$file"
  sed -i '' 's/\([[:space:]]*\)createdBy: {/\1User_Order_createdByIdToUser: {/g' "$file"

  # Fix alert sender/receiver in includes
  sed -i '' 's/\([[:space:]]*\)sender: {/\1User_Alert_senderIdToUser: {/g' "$file"
  sed -i '' 's/\([[:space:]]*\)receiver: {/\1User_Alert_receiverIdToUser: {/g' "$file"

  # Fix DoctorClinic relation names
  sed -i '' 's/\([[:space:]]*\)clinic: {/\1Clinic: {/g' "$file"
  sed -i '' 's/\([[:space:]]*\)doctor: {/\1User: {/g' "$file" || true

  # Fix file relations
  sed -i '' 's/\([[:space:]]*\)files: true/\1File: true/g' "$file"

  # Fix comment relations
  sed -i '' 's/\([[:space:]]*\)comments: {/\1OrderComment: {/g' "$file"
  sed -i '' 's/\([[:space:]]*\)author: {/\1User: {/g' "$file"
done

echo "Fixed relation names in API files. Backups created with .bak extension."

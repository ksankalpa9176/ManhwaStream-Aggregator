import pathlib

p = pathlib.Path('src/components/ManhwaRowItem.tsx')
src = p.read_text(encoding='utf-8')

# Remove Sparkles from import
src = src.replace(
    "import { ExternalLink, Trash2, CheckCircle, Sparkles } from 'lucide-react';",
    "import { ExternalLink, Trash2, CheckCircle } from 'lucide-react';"
)

p.write_text(src, encoding='utf-8')
print("OK - Removed Sparkles import")

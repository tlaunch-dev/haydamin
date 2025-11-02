# Data Import Guide

## CSV Template Format

Use `data-template.csv` to input your family data. Here's what each column means:

### Required Fields
- **id**: Unique identifier (e.g., `gm-1`, `child-1`) - keep it simple and consistent
- **name**: English name (e.g., "Sitt Layla")
- **nameAr**: Arabic name (e.g., "ست ليلى")
- **relationship**: English relationship (e.g., "you", "your daughter")
- **relationshipAr**: Arabic relationship (e.g., "أنت", "ابنتك")

### Relationship Fields
- **spouseId**: ID of spouse (leave blank if none)
- **parentId1**, **parentId2**: IDs of parents (leave blank if root level)
- **childId1** through **childId6**: IDs of children (leave blank if none)

### Optional Fields
- **birthday**: ISO format (YYYY-MM-DD) (e.g., "1945-03-15")
- **location**: English location (e.g., "Beirut, Lebanon")
- **locationAr**: Arabic location (e.g., "بيروت، لبنان")
- **favoriteFood**: English (e.g., "Kibbeh Nayyeh")
- **favoriteFoodAr**: Arabic (e.g., "كبة نية")
- **fact1**, **fact2**, **fact3**: English facts/memories
- **fact1Ar**, **fact2Ar**, **fact3Ar**: Arabic facts/memories

## Important Notes

1. **Photos**: Initial placeholder avatars will be generated. You can upload real photos through the app later.
2. **IDs**: Use consistent IDs that make sense to you (e.g., `gm-1` for grandmother, `child-1`, `child-2`)
3. **Relationships**: Make sure IDs match between family members (if person A is spouse of B, then B should have A's spouseId)
4. **Leave blank**: Empty fields will be set to null/empty arrays

## How to Import

### Step 1: Fill in the CSV
1. Open `data-template.csv` in a spreadsheet app (Excel, Google Sheets, etc.)
2. Fill in your family data
3. Save as CSV (comma-separated)

### Step 2: Run the Import Script

```bash
# Install ts-node if not already installed
npm install -D ts-node @types/node

# Run the import
npx ts-node scripts/importCSV.ts
```

### Step 3: Verify
- Open Firebase Console: https://console.firebase.google.com/project/haydamin/firestore
- Check that your data appears in the `people` collection

## Tips

- Start with the root level (grandparents) first
- Then add their children
- Then grandchildren
- Keep your CSV organized by generation for easier tracking
- You can always add more people later through the app

## Example Structure

```
Generation 1 (Root):
- gm-1: Grandmother (you)
- gf-1: Grandfather (spouse of gm-1)

Generation 2 (Children):
- child-1: First child (parentIds: gm-1, gf-1)
- child-2: Second child (parentIds: gm-1, gf-1)
- spouse-1: Spouse of child-1

Generation 3 (Grandchildren):
- grandchild-1: First grandchild (parentIds: child-1, spouse-1)
```


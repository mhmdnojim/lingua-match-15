# Split New HSK entries by part of speech

## Goal
Rebuild **New HSK 1–6 (Multilingual)** so each row represents one word in one grammatical role, with the meaning and Latin reading aligned to that role.

## Workbook changes
- Process all six sheets in `New_HSK_Vocabulary_MultiLang_HSK1-6_Tiiwii.xlsx`.
- Keep single-part-of-speech entries as one row.
- Split multi-part labels written with `;`, `、`, commas, slashes, or parenthesized forms into separate rows.
- Preserve intentional blank part-of-speech cells for idioms and fixed expressions.
- Keep the original Number and append stable suffixes to split entries: `25-a`, `25-b`, `25-c`.
- Preserve the exact Chinese headword, including homograph suffixes such as `称1` and `称2`.

## Meaning alignment
- Assign each English sense to its matching part of speech.
- Split each translated language cell so every new row contains only the meaning for that grammatical role.
- When a language has fewer distinguishable meanings than the part-of-speech list, generate the missing role-specific translation rather than copying an unrelated meaning.
- Keep legitimate synonyms for one role together, separated according to that language’s existing punctuation convention.

## Latin readings
- Add a Latin-reading column beside every language column.
- Copy Pinyin to each split Chinese row.
- Preserve existing Latin-script words as their Latin reading.
- Transliterate Arabic, Russian, Urdu, Kazakh, Persian, and other non-Latin entries consistently on each new row.

## App integration
- Generate new compact packs for HSK1–HSK6 from the rebuilt workbook.
- Update **New HSK 1–6 (Multilingual)** in the vocabulary picker to use the split rows.
- Treat every suffixed row as an independent meaning/card; do not merge it back with sibling parts of speech.
- Ensure workbook browsing and export retain the suffixed Number, part of speech, role-specific meanings, and all Latin columns.

## Validation
- Confirm every source row is represented and every split row has exactly one part of speech.
- Check row counts, suffix uniqueness, all language/Latin columns, and sheet order.
- Recalculate the workbook and verify zero formula errors.
- Test several noun/verb/adjective/classifier examples in the app and confirm the rebuilt workbook exports successfully.

## Deliverables
- Updated downloadable `.xlsx` workbook.
- Updated built-in **New HSK 1–6 (Multilingual)** dataset in the app.

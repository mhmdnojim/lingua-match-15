## Goal

Turn the existing vocabulary list into a workbook browser where users can inspect the complete selected workbook before playing.

## Experience

- Add an **Explore workbook** action beside the workbook selector.
- Open a full-height browser showing the workbook name, all available level sheets, and the number of entries in each sheet.
- Let users switch between sheets such as A1–C1 or HSK1–HSK6 without changing the current game level.
- Show searchable rows with the MAIN word, part of speech, definition, Latin reading, and every available translation.
- Expand a row to inspect all its details clearly, including its Sense ID and language values.
- Keep large workbooks fast by loading one sheet at a time and showing a loading state.

## Behavior

- Built-in workbooks load unopened sheets directly from their bundled data.
- Uploaded multi-sheet workbooks use the locally saved level files already created during import.
- Exploring is read-only: it does not reset the current batch, game progress, selected level, or uploaded data.
- Search applies to the currently viewed sheet across words, definitions, transliterations, and translations.

## Technical details

- Extend the existing vocabulary-list dialog instead of creating a competing word-list experience.
- Pass the selected workbook family and level-loading helpers from the game screen.
- Reuse existing language metadata and workbook-family helpers so built-in and uploaded files follow the same display rules.
- Preserve the current compact vocabulary list action while upgrading its label and contents to workbook exploration.

# Curated OCR Test Set

- Document type: Drawing
- Contains 50 unique document IDs and 50 unique PDF contents (SHA-256).
- Candidate files were taken from the top level of the source folder; the original Test folder was left unchanged.
- For each document ID, the numerically highest available revision was selected. Byte-identical copies were collapsed by SHA-256.
- IDs already represented in the prior Test folder were prioritized; remaining IDs were ordered by SHA-256(seed|document ID) and added until 50 were selected.
- Sampling seed: 20261011
- This is a file-selection manifest only. OCR outputs and expert-verified ground-truth labels have not been added.
- See test_manifest.csv for the selected filenames, revisions, hashes, and selection basis.

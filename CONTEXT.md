# QSMS Domain Glossary

This document defines the canonical terminology used across the QSMS Rework Management System project.

### Item Master
A central reference directory of all items/products in the system. Each item is defined by three core properties:
- **Item Number**: A unique alphanumeric identifier for the item (e.g. `TEST-001`).
- **Item Code**: A unique numeric barcode identifier for the item (e.g. `123456789`).
- **Item Name**: The descriptive name of the item.

### Incomplete Item
A record in the [Item Master](#item-master) that is missing one or more of the three core properties (having `null` or empty values).

### Complete Item
A record in the [Item Master](#item-master) that has all three core properties successfully populated.

### Two-Way Autofill
A user interface interaction that automatically queries the [Item Master](#item-master) and fills in the remaining fields in the case form (with a 600ms debounce) when either the **Item Number** or **Item Code** is provided.

### Smart Master Upsert
The background synchronization logic that inserts new items into the [Item Master](#item-master) or updates existing [Incomplete Items](#incomplete-item) to populate missing fields, preventing duplicate records and ensuring data completeness.

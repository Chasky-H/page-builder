# Page Builder Architecture

## Overview

<!-- [Provide an overview of the addon architecture] -->
The Page Builder is an addon that enables the creation of custom pages in the application, these pages can be used specifically, or instead of existing pages (eg. HomePage).

The Page Builder has a settings editor that allows admins to create & edit these pages by dragging & dropping PageBlocks (AKA "Block") onto pages. When a PageBlock is dragged onto a page an instance of this PageBlock is created on this Page & the Page Builder addon will host this PageBlock using the regular communication of addon hosting (NgComponent).

Addons can create PageBlocks that will be available in the Pages Page editor. These PageBlock will be available in Page editor when they are added to the PageBlock relation.

The Page Builder allows the pages to be divided into sections (rows), and each section can hold multiple PageBlocks in predefined ratios.

The PageBlock adapts the sections per screen size, meaning that one row on a desktop can be divided (left to right) into multiple rows

These PageBlocks must conform to the below communication API.

Every PageBlock added using this relation needs to be aware of the size it is given on the page as well as the media screen size, and should adapt accordingly.
The width of the PageBlock is fixed based on the configuration, and the height is set by the tallest PageBlock in the section (row).

Every PageBlock needs to be able to present itself with a skeleton, until the data is ready. This needs to be defined per PageBlock by the UI/UX designer.

Every PageBlock can supply an additional NgComponent that allows for the  configuration of the PageBlock in the specific Page.

---

## Infrastructure

<!-- [Provide any special infrastructue the addon uses (eg. dedicated lambda etc.) and explain their usage] -->
- The Page Builder addon load the page blocks remotly by webpack & module federation (the relevant data saved on the page block relation).
- The Page Builder addon is transfer parameters between the page blocks if they ask, each page block can be producer of a parameter (this way he can raise new value or change existing one). each page block can be consumer of parameter (this way he can get the parameter value) those declarations are made in the settings mode (when edit a page).

---

## Data Model

<!-- [Provide any data models used by the addon (eg. ADAL tables etc.)] -->
Working with configurations

---

## PNS Usage

<!-- [Provide any PNS subscriptions or publishes done by the addon] -->

---

## Relations

<!-- [Provide any relations provided by the addon, or that the addon subscribes to ] -->
- SettingsBlock - Used for load the pages settings.
- PageBlock - Used for load all the blocks and the available blocks in (settings mode) [read more..](https://apidesign.pepperi.com/addon-relations/addons-link-table/relation-names/page-block).
- DataImportResource - Used for importing the page by the DIMX addon [read more..](https://apidesign.pepperi.com/addon-relations/addons-link-table/relation-names/data-import).
- DataExportResource - Used for exporting the page by the DIMX addon [read more...](https://apidesign.pepperi.com/addon-relations/addons-link-table/relation-names/export-data-source).

---

## Topics

<!-- [Provide a list of sustantial topics in the addons design and supply information regarding each topic] -->
### Blocks events
#### High Level

<!-- [Proivde a high level review of the topic] -->
Provide a lifecycle to a block, this way the block can raise event such as state-change or button-click and pages will call the CPI event of the relevant block in the CPI 
calculate all the changes and return the new data to the UI.
[read more..](https://apidesign.pepperi.com/addon-relations/addons-link-table/relation-names/page-block#block-events).

<!-- #### Key Classes: -->
<!-- - `Topic1Factory` - Creates all the classes for topic1 -->

<!-- #### Diagram -->

<!-- [Provide any diagrams relevant to topic1] -->

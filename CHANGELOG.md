# Changelog

## 1.3.1.2 - 2020-10-28

### Fixed
- Fixed an error that could occur during the Craft 3.5 migration, if there were any field labels that belonged to deleted field layouts (thanks @iainsaxon)

## 1.3.1.1 - 2020-09-08

> {warning} This update rewrites the previous 1.3 migrations to avoid a project config rebuild, and instead attempts to update the project config directly where possible.  If some labels couldn't be written to the project config for some reason (e.g. if some field layouts in the project config haven't yet been updated to the new format), those labels will be updated in the database, and a warning will be logged advising that a project config rebuild will need to be run manually.

### Fixed
- Rewrote the 1.3.0/1.3.1 migrations to update the project config where possible, without a rebuild that could cause conflicts in some cases

## 1.3.1 - 2020-08-12

> {warning} This update will execute a project config rebuild, to ensure all field layout changes are saved to the project config, due to issues with the 1.3.0 migration saving field label data to the database but not the project config.  Please ensure you have backed up your Craft install's `config/project` directory before proceeding with this update.

### Fixed
- Added a migration to set field label overrides to `__blank__` if `Hide Name` was set
- The migration also executes a project config rebuild to make sure the updated field layouts are saved to the project config

## 1.3.0 - 2020-08-07

> {warning} This release migrates field label/instruction overrides from the Field Labels format to the Craft 3.5 format.  After updating, please check to confirm your relabelled data has successfully been migrated to the Craft 3.5 format, then uninstall Field Labels.  While all control panel functionality of Field Labels has been permanently disabled, Field Labels data and all other functionality will remain available while the plugin is still installed, in case it's still required for any other plugin or module.

### Added
- Added a migration of field label/instruction overrides from the Field Labels format to the Craft CMS 3.5 format

### Changed
- All front-end relabelling functionality has been disabled, to prevent Field Labels from attempting to relabel fields that had more recently been relabelled within Craft 3.5

## 1.2.4 - 2020-07-23

### Fixed
- Fixed a bug where labels would not apply to new quick post widgets, if no quick post widgets already existed on the dashboard
- Fixed a bug with quick post widgets where translatable field icons would be lost when applying labels

## 1.2.3 - 2020-07-19

> {warning} With this release, Field Labels is prevented from applying its functionality to the Craft 3.5 beta.  Field Labels will not be compatible with Craft 3.5, due to Craft 3.5's new field layout designer including the ability to override field labels and instructions.  A future Craft 3.5-exclusive Field Labels update will migrate Field Labels data to the new format.

### Fixed
- Fixed an issue when saving a Neo block type, where Field Labels would delete existing labels before Neo would recreate them, instead of just having Neo update the existing labels
- Fixed a JavaScript error that could occur when trying to override labels on field inputs

## 1.2.2 - 2020-06-06

### Fixed
- Fixed issue where labels were not displaying on entry drafts if the user did not have permission to publish the draft (thanks @leevigraham)

## 1.2.1 - 2020-06-03

### Fixed
- Fixed issue with the Craft 3.5 beta, where labels were not displaying on drafts (thanks @leevigraham)

## 1.2.0 - 2020-05-24

### Added
- Added support for Verbb Wishlist

### Changed
- Changed how Field Labels saves labels from field layout designer pages, with better handling of FLD pages with multiple field layouts (e.g. Commerce products/variants, Wishlist lists/items)

### Fixed
- Fixed relabelled fields showing `null` as the updated name in the field layout editor if the name wasn't overridden

## 1.1.10 - 2020-03-24

### Added
- add handling for localized create buttons. thanks @swey

## 1.1.9 - 2020-03-11

### Changed
- Update context for Craft 3.4+. #47

## 1.1.8 - 2019-12-09

### Fixed
- Fix #45 - field labels reference will now be removed when deleting a field/layout

## 1.1.7 - 2019-10-17

### Changed
- Relabeled Fields will now show the updated label with the original e.g ~~text~~ Content. #41

## 1.1.6 - 2019-09-13

### Fixed
- Fix #42

## 1.1.5 - 2019-07-30

### Added
- Add Verbb Gift Voucher support. Thanks @ttempleton

### Fixed
- Fix issue with Events labels not showing. Thanks @ttempleton

## 1.1.4 - 2019-07-15

### Fixed
- Fix for labels not being applied in Craft 3.2

## 1.1.3 - 2019-06-24

### Fixed
- Ensure $label exists when triggering afterSaveLabel event - thanks @ttempleton

## 1.1.2 - 2019-06-05

### Added
- Add ability to hide field names/instructions - thanks @ttempleton
- Add support for Verbb Events - thanks @engram-design

## 1.1.1 - 2019-05-16

### Changed
- Update minimum Craft version in readme - thanks @ttempleton
- Apply label names to error messages - thanks @ttempleton

### Fixed
- Fix labels not being deleted when name/instructions removed - thanks @ttempleton

## 1.1.0 - 2019-05-09
### Added
- Add quick post widgets support - thanks @ttempleton

### Changed
- check to see if plugin is enabled as well as installed - thanks @samuelbirch
- Convert instructions from varchar(255) to text - thanks @ttempleton

## 1.0.7 - 2019-04-03
### Fixed
- Fixed issue on multi-site Craft installations where applying a field label to a translatable field would remove the translatable icon

## 1.0.6 - 2019-04-03
### Added
- Added support for the project config rebuild functionality introduced in Craft CMS 3.1.20

### Changed
- Field Labels now requires Craft CMS 3.1.20 or later
- Changed the Field Labels instructions input to a textarea, for consistency with Craft's presentation of instructions on a field settings page

### Fixed
- Fixed issue where a Field Labels instruction could duplicate if the field instruction it replaced was multi-line

## 1.0.5 - 2019-03-29
### Added
- Added support for the Solspace Calendar plugin

## 1.0.4 - 2019-03-29
### Fixed
- Fixed error that occurred when attempting to create a new element from an element field's modal
- Fixed error that occurred if Craft Commerce was required by a Craft project but not installed

## 1.0.3 - 2019-03-28
### Fixed
- Fixed error when trying to perform a project config sync from a terminal
- Fixed potential error if a section has no entry types

## 1.0.2 - 2019-03-27
### Fixed
- Fixed issue with field labels not being applied to entry drafts

## 1.0.1 - 2019-03-26
### Fixed
- Fixed issue where `getIsGuest()` returned true even if user was signed in (thanks @aaronbushnell)
- Fixed issue with field labels not being applied to Commerce orders

## 1.0.0 - 2019-03-25
- Initial release for Craft 3

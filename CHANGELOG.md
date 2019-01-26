# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.0.11]
### Changed
- Update Jest test library to 24.0.0

## [4.0.10]
### Added
- Add additional logging of errors
- Additional test cases
### Changed
- Logging of error message on LOG_NORMAL/LOG_VERBOSE and full error on LOG_DEBUG
- Migrate two tests towards comparing with an Error (duck type comparison for now)
- Update Travis CI badge

## [4.0.9]
### Added
- Export new constants:
  - The default resource id provided if one is not provided
  - The default failure reason text (with/without context)
### Changed
- Rewrite of commits to reflect individual contributors after migration to organization.
- Updated this CHANGELOG

## [4.0.8] - 2018-10-27
### Added
- Added a change log file
### Changed
- Updated/clarified authorship and copyright. NPM packages and GitHub repositories are migrating to newly created organizations.

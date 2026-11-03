# Change log

## Unreleased

[*All changes*](https://codeberg.org/BunnyNabbit/classicborne/compare/0.1.1...main).

- Package
  - *sqlite3* is now an optional dependency.
	- *better-sqlite3* is added as an optional dependency. The newly introduced KeyframeRecord adapters will use these dependencies if available.
- `index.mjs`
  - [Warns when imported](https://codeberg.org/BunnyNabbit/classicborne/commit/f0e50e1f48b53a7bd0c2778fab81e753b65a01f2). Using the barrel file has always been ill advised.
- BaseHeartbeat
  - [Changed](https://codeberg.org/BunnyNabbit/classicborne/commit/e581a173d269c7048fe943185ed43c8d2a24c09b#diff-9fae3f5c2f27a5637b785e63400eaf3e28952dbe) the default server name from "A classicborne server." to "A classicborne universe.".
- KeyframeRecord
  - Refactored from the `/class/level/changerecord/ChangeRecord.mjs` file. The class is exported from `/class/level/changerecord/KeyframeRecord.mjs`.
	- Uses adapters to select a suitable SQLite dependency.
- [BasePlayer](https://classicborne.bunnynabbit.com/classes/BasePlayer.html)
  - Added [BasePlayer#getDisplayName](https://classicborne.bunnynabbit.com/classes/BasePlayer.html#getdisplayname).
- Significant documentation and typing changes. May potentially be breaking if types are checked.
  - When referring to static members of a class, the term "class-side" is now used instead of "static.".

### Breaking

-

### 0.0.0

Initial release.
